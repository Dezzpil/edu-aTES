import { Event } from '../../../event';
export interface TaskCreated1 extends Event {
	event_name: 'TaskCreated';
	event_version: 1;
	data: DataTaskCreated1;
}

export interface DataTaskCreated1 {
	public_id: string;
	description: string;
	account_public_id: string;
}
