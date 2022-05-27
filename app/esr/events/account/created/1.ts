import { Event } from '../../../event';

export interface AccountCreated1 extends Event {
	event_name: 'AccountCreated';
	event_version: 1;
	data: {
		public_id: string;
		email: string;
		/** @nullable */
		full_name: string | null;
		/** @nullable */
		position: string | null;
	};
}
