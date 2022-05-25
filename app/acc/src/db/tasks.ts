import { Pool } from 'pg';
import { AbstractModel } from './model';

export interface TaskData {
	id?: string;
	public_id: string;
	description: string;
	price: number;
}

export class Tasks extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findByPublicId(id: string): Promise<TaskData> {
		const tasks = await this._find<TaskData[]>('SELECT * FROM tasks WHERE id = $1', [id]);
		return tasks[0];
	}

	async create(publicId: string, desc: string, price: number): Promise<TaskData> {
		const q = `INSERT INTO tasks (public_id, description, price) VALUES ($1, $2, $3) ON CONFLICT (public_id) DO UPDATE SET price = $3 RETURNING *`;
		const res = await this._modify(q, [publicId, desc, price]);
		return res.rows[0];
	}
}
