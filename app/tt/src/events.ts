export type AccountEventName = 'AccountCreated' | 'AccountUpdated' | 'AccountDeleted' | 'AccountRoleChanged';
export type TaskEventName = 'TaskCreated' | 'TaskReassign' | 'TaskCompleted';

export const queueUsersCUD = 'accounts-stream';
export const queueUsersBE = 'accounts';

export const queueTaskCUD = 'tasks-stream';
export const queueTaskBE = 'tasks';
