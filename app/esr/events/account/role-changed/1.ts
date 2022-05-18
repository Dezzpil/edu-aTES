import { Event } from '../../../event';

export interface AccountDeleted extends Event {
	event_name: 'AccountRoleChanged';
	event_version: 1;
	data: {
		public_id: string;
		role: string;
	};
}
