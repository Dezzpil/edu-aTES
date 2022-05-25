import { Pool } from 'pg';
import { Channel } from 'amqplib';
import { QueueUsersBE, QueueUsersCUD } from '../../../esr/queues';
import { AccountCreated1 } from '../../../esr/events/account/created/1';
import { AccountCreated2 } from '../../../esr/events/account/created/2';
import { AccountRoleChanged1 } from '../../../esr/events/account/role-changed/1';
import { AccountUpdated1 } from '../../../esr/events/account/updated/1';
import { Balances } from '../db/balances';
import { Users } from '../db/users';
import { validateEventFromMessage } from '../helpers';

export const users = async (pool: Pool, ch: Channel) => {
	await ch.assertQueue(QueueUsersCUD, { durable: true });
	await ch.assertQueue(QueueUsersBE, { durable: true });

	const um = new Users(pool);
	const bm = new Balances(pool);

	await ch.consume(
		QueueUsersCUD,
		async msg => {
			const event = validateEventFromMessage(msg);
			if (event) {
				switch (event.event_name) {
					case 'AccountCreated': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountCreated1).data;
								const user = await um.create(
									data.public_id,
									data.email,
									data.position,
									data.full_name
								);
								await bm.create(user);
								break;
							}
							case 2: {
								const data = (event as AccountCreated2).data;
								const fullName = [data.last_name, data.first_name].join();
								const user = await um.create(
									data.public_id,
									data.email,
									data.position,
									fullName
								);
								await bm.create(user);
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
								const user = await um.update(
									data.public_id,
									data.email,
									data.position,
									data.full_name
								);
								const balance = await bm.findForUser(user);
								if (!balance) await bm.create(user);
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
		QueueUsersBE,
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
								const balance = await bm.findForUser(user);
								if (!balance) await bm.create(user);
							}
						}
					}
				}
			}
		},
		{ noAck: false }
	);
};
