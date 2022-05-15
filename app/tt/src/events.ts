import { nanoid } from 'nanoid';

export const queueUsersCUD = 'accounts-stream';
export const queueUsersBE = 'accounts';

export interface AccountEvent {
	event_id: string;
	event_version: number;
	event_name: 'AccountCreated' | 'AccountUpdated' | 'AccountDeleted' | 'AccountRoleChanged';
	event_time: string;
	producer: string;
	data: AccountsEventsModifyData | AccountsEventsDeleteData | AccountsEventsRoleData;
}

export interface AccountsEventsModifyData {
	public_id: string;
	email: string;
	full_name: string;
	position: string | null;
}

export interface AccountsEventsDeleteData {
	public_id: string;
}

export interface AccountsEventsRoleData {
	public_id: string;
	role: string;
}

export const queueTaskCUD = 'tasks-stream';
export const queueTaskBE = 'tasks';

export type TaskEventType = 'TaskCreated' | 'TaskReassign' | 'TaskCompleted';

export interface TaskEvent {
	event_id: string;
	event_version: number;
	event_name: TaskEventType;
	event_time: string;
	producer: string;
	data: TaskEventCreatedData | TaskEventReassignData;
}

export interface TaskEventCreatedData {
	id: string;
	description: string;
	worker_id: string;
}

export interface TaskEventReassignData {
	id: string;
	worker_id: string;
}

// TODO TaskEventUpdateData

export function createEvent(
	name: TaskEventType,
	data: TaskEventCreatedData | TaskEventReassignData
): TaskEvent {
	return {
		event_id: nanoid(),
		event_name: name,
		event_version: 1,
		producer: 'rabbitmq',
		event_time: Date.now() + '',
		data,
	};
}
