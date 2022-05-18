import { nanoid } from 'nanoid';

export interface Event {
	event_id: string;
	event_version: number;
	event_name: string;
	event_time: string;
	producer: string;
	data: {};
}

export function toJson(name: string, version: number, data: Record<string, any>): string {
	const event = {
		event_id: nanoid(),
		event_name: name,
		event_time: Date.now() + '',
		event_version: version,
		producer: '?',
		data,
	};

	// TODO validate

	return JSON.stringify(event);
}

export function fromJson<T>(event: string): T {
	// TODO
	// TODO validate by schema
	return {} as T;
}
