import { Event } from '../../../event';

export interface AccountRoleChanged extends Event {
	event_name: 'AccountRoleChanged';
	event_version: 1;
	data: {
		public_id: string;
		role: string;
	};
}
