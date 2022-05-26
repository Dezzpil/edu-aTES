import { Pool } from 'pg';
import { Channel, Connection } from 'amqplib';
import { ExchangeUsersBE, ExchangeUsersCUD } from '../../../esr/queues';
import { AccountCreated1 } from '../../../esr/events/account/created/1';
import { AccountCreated2 } from '../../../esr/events/account/created/2';
import { AccountRoleChanged1 } from '../../../esr/events/account/role-changed/1';
import { AccountUpdated1 } from '../../../esr/events/account/updated/1';
import { Users } from '../db/users';
import { validateEventFromMessage } from '../helpers';
import { inspect } from 'util';

export const users = async (pool: Pool, conn: Connection) => {
	const um = new Users(pool);

	const chCUD = await conn.createChannel();
	await chCUD.assertExchange(ExchangeUsersCUD, 'fanout', { durable: false });
	const qCUD = await chCUD.assertQueue('', { exclusive: true });
	await chCUD.bindQueue(qCUD.queue, ExchangeUsersCUD, '');
	await chCUD.consume(
		qCUD.queue,
		async msg => {
			const event = validateEventFromMessage(msg);
			if (event) {
				switch (event.event_name) {
					// TODO добавить учет имени пользователя
					case 'AccountCreated': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountCreated1).data;
								const user = await um.create(
									data.public_id,
									data.email,
									data.position
									// data.full_name
								);
								console.log(`user created ${inspect(user)}`);
								break;
							}
							case 2: {
								const data = (event as AccountCreated2).data;
								// const fullName = [data.last_name, data.first_name].join();
								const user = await um.create(
									data.public_id,
									data.email,
									data.position
									// fullName
								);
								console.log(`user created ${inspect(user)}`);
								break;
							}
							default: {
								throw new Error(`not implemented`);
							}
						}
						break;
					}
					// TODO добавить учет имени пользователя
					case 'AccountUpdated': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountUpdated1).data;
								const user = await um.upsert(data.public_id, data.email, data.position);
								console.log(`user updated ${inspect(user)}`);
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

	const chBE = await conn.createChannel();
	await chBE.assertExchange(ExchangeUsersBE, 'fanout', { durable: false });
	const qBE = await chBE.assertQueue('', { exclusive: true });
	await chBE.bindQueue(qBE.queue, ExchangeUsersBE, '');
	await chBE.consume(
		qBE.queue,
		async msg => {
			const event = validateEventFromMessage(msg);
			if (event) {
				switch (event.event_name) {
					case 'AccountRoleChanged': {
						switch (event.event_version) {
							case 1: {
								const data = (event as AccountRoleChanged1).data;
								const user = await um.findByPublicId(data.public_id);
								const userUpdated = await um.changeRole(user, data.role);
								console.log(`user role changed ${inspect(userUpdated)}`);
							}
						}
					}
				}
			}
		},
		{ noAck: false }
	);
};
