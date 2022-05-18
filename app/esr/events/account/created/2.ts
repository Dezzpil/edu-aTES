import { Event } from '../../../event';

export interface AccountCreated2 extends Event {
	event_name: 'AccountCreated';
	event_version: 2;
	data: {
		public_id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		position: string | null;
	};
}
