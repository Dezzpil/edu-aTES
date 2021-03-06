import { Event } from '../../../event';

export interface AccountDeleted extends Event {
	event_name: 'AccountDeleted';
	event_version: 1;
	data: {
		public_id: string;
	};
}
