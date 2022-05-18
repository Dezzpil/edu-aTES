import { Pool } from 'pg';
import client, { Channel } from 'amqplib';
import { Users } from '../db/users';
import { AccountsEventsModifyData, queueUsersBE, queueUsersCUD } from '../events';

export const users = async (pool: Pool, ch: Channel) => {
	await ch.assertQueue(queueUsersCUD, { durable: true });
	await ch.assertQueue(queueUsersBE, { durable: true });

	const um = new Users(pool);

	await ch.consume(
		queueUsersCUD,
		async msg => {
			if (msg) {
				const event = JSON.parse(msg.content.toString());
				if ('event_name' in event) {
					switch (event.event_name) {
						case 'AccountCreated': {
							const user = await um.create(event.data as AccountsEventsModifyData);
							console.log(`event 'AccountCreated': user ${user.id} created`);
							break;
						}
						case 'AccountUpdated': {
							// TODO
							break;
						}
						case 'AccountDeleted': {
							// TODO
							break;
						}
					}
				}
			}
		},
		{ noAck: false }
	);

	await ch.consume(
		queueUsersBE,
		async msg => {
			if (msg) {
				const event = JSON.parse(msg.content.toString());
				if ('event_name' in event) {
					if (event.event_name === 'AccountRoleChanged') {
						const user = await um.findById(event.data.public_id);
						await um.changeRole(user, event.data.role);
						console.log(
							`event 'AccountRoleChanged': user ${user.id} changed role to ${user.role}`
						);
					}
				}
			}
		},
		{ noAck: false }
	);
};
