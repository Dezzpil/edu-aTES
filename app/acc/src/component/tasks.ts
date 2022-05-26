import { Pool } from 'pg';
import { Connection, ConsumeMessage } from 'amqplib';
import { ExchangeTasksBE, ExchangeTasksCUD } from '../../../esr/names';
import { Tasks } from '../db/tasks';
import { getTask, getUser, validateEventFromMessage } from '../helpers';
import { DataTaskCreated1 } from '../../../esr/events/task/created/1';
import { calculatePrice, getRandomInt } from './price';
import { DataTaskReassign1 } from '../../../esr/events/task/reassign/1';
import { Users } from '../db/users';
import { Transactions } from '../db/transactions';
import { DataTaskCompleted1 } from '../../../esr/events/task/completed/1';
import { inspect } from 'util';

export const tasks = async (pool: Pool, conn: Connection) => {
	const um = new Users(pool);
	const tm = new Tasks(pool);
	const trm = new Transactions(pool);

	const chCUD = await conn.createChannel();
	await chCUD.assertExchange(ExchangeTasksCUD, 'fanout', { durable: false });
	const qCUD = await chCUD.assertQueue('', { exclusive: true });
	await chCUD.bindQueue(qCUD.queue, ExchangeTasksCUD, '');
	await chCUD.consume(qCUD.queue, async (msg: ConsumeMessage | null) => {
		const event = validateEventFromMessage(msg);
		if (event) {
			switch (event.event_name) {
				case 'TaskCreated': {
					switch (event.event_version) {
						case 1:
							const price = calculatePrice();
							const data = event.data as DataTaskCreated1;
							const task = await tm.create(data.public_id, data.description, price);
							console.log(`task created ${inspect(task)}`);
							break;
						default:
							throw new Error('not implemented!');
					}
				}
			}
		}
	});

	const chBE = await conn.createChannel();
	await chBE.assertExchange(ExchangeTasksBE, 'fanout', { durable: false });
	const qBE = await chBE.assertQueue('', { exclusive: true });
	await chBE.bindQueue(qBE.queue, ExchangeTasksBE, '');
	await chBE.consume(qBE.queue, async (msg: ConsumeMessage | null) => {
		const event = validateEventFromMessage(msg);
		if (event) {
			switch (event.event_name) {
				case 'TaskReassign': {
					switch (event.event_version) {
						case 1:
							const data = event.data as DataTaskReassign1;
							const task = await getTask(data.public_id, tm);
							const assigner = await getUser(data.assigner_public_id, um);
							const worker = await getUser(data.worker_public_id, um);
							const cost = getRandomInt(10, 20); // TODO можно хранить цену реасайна в таске
							const transaction = await trm.transfer(worker, assigner, task, cost);
							console.log(`task reassigned ${inspect(transaction)}`);
							break;
						default: {
							throw new Error(`not implemented`);
						}
					}
					break;
				}
				case 'TaskCompleted': {
					switch (event.event_version) {
						case 1:
							const data = event.data as DataTaskCompleted1;
							const task = await getTask(data.public_id, tm);
							const worker = await getUser(data.account_public_id, um);
							const transaction = await trm.enroll(worker, task);
							console.log(`task completed ${inspect(transaction)}`);
							break;
						default: {
							throw new Error(`not implemented`);
						}
					}
					break;
				}
				default:
					throw new Error('not implemented');
			}
		}
	});
};
