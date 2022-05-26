import { Event } from '../../../event';
export interface TaskReassign1 extends Event {
	event_name: 'TaskReassign';
	event_version: 1;
	data: DataTaskReassign1;
}

export interface DataTaskReassign1 {
	public_id: string;
	worker_public_id: string;
	assigner_public_id: string;
}
