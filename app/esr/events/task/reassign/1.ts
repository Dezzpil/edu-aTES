import { Event } from '../../../event';
export interface TaskReassign1 extends Event {
	event_name: 'TaskReassign';
	event_version: 1;
	data: {
		public_id: string;
		account_public_id: string;
	};
}
