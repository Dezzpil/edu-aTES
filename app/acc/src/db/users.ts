import { Pool } from 'pg';
import { AbstractModel } from './model';

export interface UserData {
	id?: number;
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

	async findByPublicId(publicId: string): Promise<UserData> {
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
		public_id: string,
		email: string,
		position: string | null,
		name: string | null
	): Promise<UserData> {
		const user = {
			public_id,
			email,
			role: position || UserRoles.Admin,
		} as UserData;
		const result = await this._modify(`INSERT INTO users (public_id, role, email) VALUES ($1, $2, $3)`, [
			user.public_id,
			user.role,
			user.email,
		]);
		return result.rows[0];
	}

	async update(
		public_id: string,
		email: string,
		position: string | null,
		name: string | null
	): Promise<UserData> {
		// TODO implement
		const r = await this._find<UserData[]>(`SELECT * FROM users WHERE public_id = $1`, [public_id]);
		return r[0];
	}

	async changeRole(user: UserData, role: string) {
		user.role = role;
		const q = `UPDATE users SET role=$1 WHERE public_id=$2`;
		const res = await this._modify(q, [role, user.public_id]);
		return res.rows[0];
	}
}
