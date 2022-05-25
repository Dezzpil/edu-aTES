import { ConsumeMessage } from 'amqplib';
import { Event, fromJSON } from '../../esr/event';

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
