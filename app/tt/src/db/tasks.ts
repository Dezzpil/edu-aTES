import { Pool } from 'pg';
import { UserData, UserRoles } from './users';
import { AbstractModel } from './model';

export interface TaskData {
	id: string;
	public_id: string;
	description: string;
	status: TaskStatus;
	created_at: Date;
	created_by: string; // user.id
	assigned_at: Date;
	assigned_to: string; // user.id
	completed_at: Date;
	completed_by: string; // user.id
	// assigns: AssignData
}

export enum TaskStatus {
	New = 0,
	Assigned = 1,
	Completed = 2,
}

export interface AssignData {
	id: string;
	task_id: string;
	created_at: Date;
	created_by: string; // user.id
	was: string; // user.id
	to: string; // user.id
}

export class Tasks extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findForUser(user: UserData): Promise<TaskData[]> {
		const q = ['SELECT * FROM tasks'];
		if (user.role === UserRoles.Worker) {
			q.push(`WHERE assigned_to = $1`);
		}
		q.push('ORDER BY created_at DESC');
		return this._find<TaskData[]>(q.join(' '), [user.public_id]);
	}

	async findById(id: string): Promise<TaskData> {
		const tasks = await this._find<TaskData[]>('SELECT * FROM tasks WHERE id = $1', [id]);
		return tasks[0];
	}

	async findAllNotCompleted(): Promise<TaskData[]> {
		return this._find<TaskData[]>(`SELECT * FROM tasks WHERE status != $1`, [TaskStatus.Completed]);
	}

	async create(user: UserData, desc: string, assignToUserId: string): Promise<TaskData> {
		const data = [desc, TaskStatus.New, new Date(), user.public_id, new Date(), assignToUserId];
		const q = `INSERT INTO tasks (description, status, created_at, created_by, assigned_at, assigned_to) VALUES ($1, $2, $3, $4, $5, $6)`;
		const res = await this._modify(q, data);
		return res.rows[0];
	}

	async complete(task: TaskData, user: UserData): Promise<TaskData> {
		// TODO проверка выполнености
		const q = `UPDATE tasks SET completed_at=$1, completed_by=$2, status=$3 WHERE id=$4`;
		const res = await this._modify(q, [new Date(), user.public_id, TaskStatus.Completed, task.id]);
		task = Object.assign({}, res.rows[0]);
		return task;
	}

	async reassign(task: TaskData, assignedToUser: UserData): Promise<TaskData> {
		// TODO проверка статуса
		// TODO проверка роли пользователя
		const q = `UPDATE tasks SET assigned_at=$1, assigned_to=$2, status=$3 WHERE id=$4`;
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
