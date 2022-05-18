import { Event } from '../../../event';
export interface TaskCreated extends Event {
	event_name: 'TaskCreated';
	event_version: 1;
	data: {
		id: string;
		description: string;
		worker_id: string;
	};
}
