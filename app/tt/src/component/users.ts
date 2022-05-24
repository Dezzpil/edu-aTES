import { Pool } from 'pg';
import client, { Channel, ConsumeMessage } from 'amqplib';
import { Users } from '../db/users';
import { queueUsersBE, queueUsersCUD } from '../events';
import { Event, fromJSON } from '../../../esr/event';
import { AccountCreated1 } from '../../../esr/events/account/created/1';
import { AccountCreated2 } from '../../../esr/events/account/created/2';
import { AccountUpdated1 } from '../../../esr/events/account/updated/1';
import { AccountRoleChanged1 } from '../../../esr/events/account/role-changed/1';

function validateEventFromMessage(msg: ConsumeMessage | null): Event | null {
	if (msg) {
		console.log('consumed message');
		try {
			console.log(msg.content.toString());
			const event = fromJSON<Event>(msg.content.toString());
			console.log(event);
			return event;
		} catch (e: any) {
			// TODO работа с ошибками;
			console.log(e);
		}
	}
	return null;
}

export const users = async (pool: Pool, ch: Channel) => {
	await ch.assertQueue(queueUsersCUD, { durable: true });
	await ch.assertQueue(queueUsersBE, { durable: true });

	const um = new Users(pool);

	await ch.consume(
		queueUsersCUD,
		async msg => {
			const event = validateEventFromMessage(msg);
			if (event) {
				switch (event.event_name) {
					case 'AccountCreated': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountCreated1).data;
								await um.create(data.public_id, data.email, data.position, data.full_name);
								break;
							}
							case 2: {
								const data = (event as AccountCreated2).data;
								const fullName = [data.last_name, data.first_name].join();
								await um.create(data.public_id, data.email, data.position, fullName);
								break;
							}
							default: {
								throw new Error(`not implemented`);
							}
						}
						break;
					}
					case 'AccountUpdated': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountUpdated1).data;
								await um.update(data.public_id, data.email, data.position, data.full_name);
								break;
							}
							default: {
								throw new Error(`not implemented`);
							}
						}
						break;
					}
					case 'AccountDeleted': {
						// TODO
						break;
					}
				}
			}
		},
		{ noAck: false }
	);

	await ch.consume(
		queueUsersBE,
		async msg => {
			const event = validateEventFromMessage(msg);
			if (event) {
				switch (event.event_name) {
					case 'AccountRoleChanged': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountRoleChanged1).data;
								const user = await um.findById(data.public_id);
								await um.changeRole(user, data.role);
							}
						}
					}
				}
			}
		},
		{ noAck: false }
	);
};
