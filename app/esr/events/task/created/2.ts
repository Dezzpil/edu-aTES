import { Event } from '../../../event';
export interface TaskCreated2 extends Event {
	event_name: 'TaskCreated';
	event_version: 2;
	data: DataTaskCreated2;
}

export interface DataTaskCreated2 {
	public_id: string;
	description: string; // backward compatibility
	title: string;
	jira_id: string;
	account_public_id: string;
}