import { Pool } from 'pg';
import { UserData, UserRoles } from './users';
import { AbstractModel } from './model';

export interface TaskData {
	id: string;
	public_id: string;
	description: string;
	status: TaskStatus;
	created_at: Date;
	created_by: string; // user.public_id
	assigned_at: Date;
	assigned_to: string; // user.public_id
	completed_at: Date;
	completed_by: string; // user.public_id
}

export enum TaskStatus {
	New = 0,
	Assigned = 1,
	Completed = 2,
}

export type TaskDateWAssignedEmail = TaskData & { email: string };

export class Tasks extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findById(id: string): Promise<TaskData> {
		const tasks = await this._find<TaskData[]>('SELECT * FROM tasks WHERE id = $1', [id]);
		return tasks[0];
	}

	async findNonCompletedForUser(user: UserData): Promise<TaskDateWAssignedEmail[]> {
		const q = ['SELECT t.*, u.email FROM tasks t LEFT JOIN users u ON u.public_id=t.assigned_to'];
		const params = [];

		q.push(`WHERE t.status != $1`);
		params.push(TaskStatus.Completed);
		if (user.role === UserRoles.Worker) {
			q.push(`AND t.assigned_to = $2`);
			params.push(user.public_id);
		}
		q.push('ORDER BY t.assigned_at DESC');
		return await this._find<TaskDateWAssignedEmail[]>(q.join(' '), params, false);
	}

	async findAllNotCompleted(): Promise<TaskDateWAssignedEmail[]> {
		return this._find<TaskDateWAssignedEmail[]>(
			`SELECT t.*, u.email FROM tasks t LEFT JOIN users u ON u.public_id=t.assigned_to WHERE t.status != $1 ORDER BY assigned_at DESC`,
			[TaskStatus.Completed],
			false
		);
	}

	async create(user: UserData, desc: string, assignToUserId: string): Promise<TaskData> {
		const data = [desc, TaskStatus.New, new Date(), user.public_id, new Date(), assignToUserId];
		const q = `INSERT INTO tasks (description, status, created_at, created_by, assigned_at, assigned_to) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
		const res = await this._modify(q, data);
		return res.rows[0];
	}

	async complete(task: TaskData, user: UserData): Promise<TaskData> {
		// TODO проверка выполнености
		const q = `UPDATE tasks SET completed_at=$1, completed_by=$2, status=$3 WHERE id=$4 RETURNING *`;
		const res = await this._modify(q, [new Date(), user.public_id, TaskStatus.Completed, task.id]);
		task = Object.assign({}, res.rows[0]);
		return task;
	}

	async reassign(task: TaskData, assignedToUser: UserData): Promise<TaskData> {
		// TODO проверка статуса
		// TODO проверка роли пользователя
		const q = `UPDATE tasks SET assigned_at=$1, assigned_to=$2, status=$3 WHERE id=$4 RETURNING *`;
		const res = await this._modify(q, [
			new Date(),
			assignedToUser.public_id,
			TaskStatus.Assigned,
			task.id,
		]);
		task = Object.assign({}, res.rows[0]);
		return task;
	}
}
