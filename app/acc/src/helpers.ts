import { ConsumeMessage } from 'amqplib';
import { Event, fromJSON } from '../../esr/event';
import { UserData, UserRoles, Users } from './db/users';
import { TaskData, Tasks } from './db/tasks';
import { calculatePrice } from './component/price';

export const validateEventFromMessage = (msg: ConsumeMessage | null): Event | null => {
	if (msg) {
		console.log('message consumed');
		try {
			const event = fromJSON<Event>(msg.content.toString());
			console.log(event);
			return event;
		} catch (e: any) {
			// TODO работа с ошибками;
			console.error(e);
		}
	}
	return null;
};

/**
 * Вернуть данные пользователя, по данному public_id
 * Если пользователя с таким public_id не существует - создать и вернуть его данные
 */
export const getUser = async (publicId: string, um: Users): Promise<UserData> => {
	let user: UserData;
	try {
		user = await um.findByPublicId(publicId);
	} catch (e: any) {
		user = await um.create(publicId, '', UserRoles.Worker, '');
	}
	return user;
};

/**
 * Вернуть данные задачи, по данному public_id
 * Если задачи с таким public_id нету - создать и вернуть данные задачи
 */
export const getTask = async (publicId: string, tm: Tasks): Promise<TaskData> => {
	let task: TaskData;
	try {
		task = await tm.findByPublicId(publicId);
	} catch (e: any) {
		task = await tm.create(publicId, '...', calculatePrice());
	}
	return task;
};
