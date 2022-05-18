import { Event } from '../../../event';

export interface AccountCreated extends Event {
	event_name: 'AccountCreated';
	event_version: 1;
	data: {
		public_id: string;
		email: string;
		full_name: string;
		position: string | null;
	};
}
