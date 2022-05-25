import { Pool } from 'pg';
import { Channel, ConsumeMessage } from 'amqplib';
import { QueueTaskBE, QueueTaskCUD, QueueUsersBE, QueueUsersCUD } from '../../../esr/queues';
import { Tasks } from '../db/tasks';
import { Balances } from '../db/balances';
import { validateEventFromMessage } from '../helpers';
import { DataTaskCreated1 } from '../../../esr/events/task/created/1';
import { calculatePrice } from './price';

export const tasks = async (pool: Pool, ch: Channel) => {
	await ch.assertQueue(QueueTaskCUD, { durable: true });
	await ch.assertQueue(QueueTaskBE, { durable: true });

	const tm = new Tasks(pool);
	const bm = new Balances(pool);

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
							// TODO списать с сотрудника деньги при ассайне задачи на него

							// TODO если нет записи задачи - создаем задачу с пустым описанием
							// TODO если нет пользователя - создаем запись пользователя и баланс
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
							// TODO начислить исполнителю бабок

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
