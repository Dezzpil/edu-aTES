import { Event } from '../../../event';

export interface AccountCreated2 extends Event {
	event_name: 'AccountCreated';
	event_version: 2;
	data: {
		public_id: string;
		email: string;
		/** @nullable */
		first_name: string | null;
		/** @nullable */
		last_name: string | null;
		/** @nullable */
		position: string | null;
	};
}
