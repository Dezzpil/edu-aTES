import { Event } from '../../../event';
export interface TaskCompleted1 extends Event {
	event_name: 'TaskCompleted';
	event_version: 1;
	data: DataTaskCompleted1;
}

export interface DataTaskCompleted1 {
	public_id: string;
	account_public_id: string;
}
