import { Event } from '../../../event';
export interface TaskCompleted1 extends Event {
	event_name: 'TaskCompleted';
	event_version: 1;
	data: {
		public_id: string;
		account_public_id: string;
	};
}
