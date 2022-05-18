import { Event } from '../../../event';

export interface AccountUpdated1 extends Event {
	event_name: 'AccountUpdated';
	event_version: 1;
	data: {
		public_id: string;
		email: string;
		full_name: string;
		position: string | null;
	};
}
