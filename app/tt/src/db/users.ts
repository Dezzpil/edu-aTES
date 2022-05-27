import { Pool } from 'pg';
import { AbstractModel } from './model';

export interface UserData {
	public_id: string;
	email: string;
	role: string;
}

export enum UserRoles {
	Worker = 'worker',
	Manager = 'manager',
	Admin = 'admin',
}

export class Users extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findById(publicId: string): Promise<UserData> {
		const users = await this._find<UserData[]>(`SELECT * FROM users WHERE public_id = $1`, [publicId]);
		return users[0];
	}

	async findAnyAdmin(): Promise<UserData> {
		const q = `SELECT * FROM users WHERE role = '${UserRoles.Admin}'`;
		const users = await this._find<UserData[]>(q);
		return users[0];
	}

	async findWorkers(): Promise<UserData[]> {
		const q = `SELECT * FROM users WHERE role = '${UserRoles.Worker}'`;
		return this._find<UserData[]>(q, [], false);
	}

	async create(
		publicId: string,
		email: string,
		position: string | null,
		name: string | null
	): Promise<UserData> {
		if (!position) position = UserRoles.Manager;
		const q = `INSERT INTO users (public_id, role, email) VALUES ($1, $2, $3) ON CONFLICT (public_id) DO UPDATE SET email = $3 RETURNING *`;
		const result = await this._modify(q, [publicId, position, email]);
		return result.rows[0];
	}

	async upsert(
		publicId: string,
		email: string,
		position: string | null,
		name: string | null
	): Promise<UserData> {
		if (!position) position = UserRoles.Worker;
		const q = `INSERT INTO users (public_id, email, role) VALUES ($1, $2, $3) ON CONFLICT (public_id) DO UPDATE SET email = $2 RETURNING *`;
		const res = await this._modify(q, [publicId, email, position]);
		return res.rows[0];
	}

	async changeRole(user: UserData, role: string) {
		const q = `UPDATE users SET role=$1 WHERE public_id=$2 RETURNING *`;
		const res = await this._modify(q, [role, user.public_id]);
		return res.rows[0];
	}
}
