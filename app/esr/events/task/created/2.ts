import { Event } from '../../../event';
export interface TaskCreated extends Event {
	event_name: 'TaskCreated';
	event_version: 2;
	data: {
		id: string;
		description: string; // backward compatibility
		title: string;
		jira_id: string;
		worker_id: string;
	};
}
