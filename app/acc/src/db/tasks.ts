import { Pool } from 'pg';
import { UserData } from './users';
import { AbstractModel } from './model';
import { DataTaskCreated1, TaskCreated1 } from '../../../esr/events/task/created/1';

export interface TaskData {
	id: string;
	public_id: string;
	description: string;
	price: number;
}

export class Tasks extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findById(id: string): Promise<TaskData> {
		const tasks = await this._find<TaskData[]>('SELECT * FROM tasks WHERE id = $1', [id]);
		return tasks[0];
	}

	async create(public_id: string, desc: string, price: number): Promise<TaskData> {
		// TODO implement
		return {} as TaskData;
	}

	async reassign(task: TaskData, toUser: UserData): Promise<TaskData> {
		// TODO implement
		return {} as TaskData;
	}

	async complete(task: TaskData, byUser: UserData): Promise<TaskData> {
		// TODO implement
		return {} as TaskData;
	}
}
