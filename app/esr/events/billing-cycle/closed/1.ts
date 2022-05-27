import { Event } from '../../../event';
export interface BillingCycleClosed1 extends Event {
	event_name: 'BillingCycleClosed';
	event_version: 1;
	data: DataBillingCycleClosed1;
}

export interface DataBillingCycleClosed1 {
	id: string;
}
