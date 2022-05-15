import { Pool } from 'pg';
import { AbstractModel } from './model';
import { AccountsEventsModifyData } from '../events';

export interface UserData {
	id: string;
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
		const users = await this._find<UserData[]>(`SELECT * FROM users WHERE id = $1`, [publicId]);
		return users[0];
	}

	async findAnyAdmin(): Promise<UserData> {
		const users = await this._find<UserData[]>(`SELECT * FROM users WHERE role = ${UserRoles.Admin}`);
		return users[0];
	}

	async findWorkers(): Promise<UserData[]> {
		return this._find<UserData[]>(`SELECT * FROM users WHERE role = ${UserRoles.Worker}`);
	}

	async create(data: AccountsEventsModifyData): Promise<UserData> {
		const user = {
			id: data.id,
			role: data.position || UserRoles.Admin,
			email: data.email,
		} as UserData;
		const result = await this._modify(`INSERT INTO users (id, role, email) VALUES ($1, $2, $3)`, [
			user.id,
			user.role,
			user.email,
		]);
		return result.rows[0];
	}

	async changeRole(user: UserData, role: string) {
		user.role = role;
		const q = `UPDATE users SET role=$1 WHERE id=$2`;
		const res = await this._modify(q, [role, user.id]);
		return res.rows[0];
	}
}
