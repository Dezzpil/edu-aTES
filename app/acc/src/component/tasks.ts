import { Pool } from 'pg';
import { Channel, ConsumeMessage } from 'amqplib';
import { QueueTaskBE, QueueTaskCUD } from '../../../esr/queues';
import { Tasks } from '../db/tasks';
import { getTask, getUser, validateEventFromMessage } from '../helpers';
import { DataTaskCreated1 } from '../../../esr/events/task/created/1';
import { calculatePrice, getRandomInt } from './price';
import { DataTaskReassign1 } from '../../../esr/events/task/reassign/1';
import { Users } from '../db/users';
import { Transactions } from '../db/transactions';
import { DataTaskCompleted1 } from '../../../esr/events/task/completed/1';

export const tasks = async (pool: Pool, ch: Channel) => {
	await ch.assertQueue(QueueTaskCUD, { durable: true });
	await ch.assertQueue(QueueTaskBE, { durable: true });

	const um = new Users(pool);
	const tm = new Tasks(pool);
	const trm = new Transactions(pool);

	await ch.consume(QueueTaskCUD, async (msg: ConsumeMessage | null) => {
		const event = validateEventFromMessage(msg);
		if (event) {
			switch (event.event_name) {
				case 'TaskCreated': {
					switch (event.event_version) {
						case 1:
							const price = calculatePrice();
							const data = event.data as DataTaskCreated1;
							const task = await tm.create(data.public_id, data.description, price);
							console.log(`task created ${task}`);
							break;
						default:
							throw new Error('not implemented!');
					}
				}
			}
		}
	});

	await ch.consume(QueueTaskBE, async (msg: ConsumeMessage | null) => {
		const event = validateEventFromMessage(msg);
		if (event) {
			switch (event.event_name) {
				case 'TaskReassign': {
					switch (event.event_version) {
						case 1:
							const data = event.data as DataTaskReassign1;
							const task = await getTask(data.public_id, tm);
							const worker = await getUser(data.account_public_id, um);
							const cost = getRandomInt(10, 20);
							const transaction = await trm.withdraw(worker, task, cost);
							console.log(`task reassigned ${transaction}`);
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
							console.log(`task completed ${transaction}`);
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
