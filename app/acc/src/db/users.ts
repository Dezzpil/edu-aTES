import { Pool } from 'pg';
import { AbstractModel } from './model';

export interface UserData {
	id?: number;
	public_id: string;
	email: string;
	role: string;
}

export type UserDataWithBalance = UserData & { balance: number };

export enum UserRoles {
	Worker = 'worker',
	Manager = 'manager',
	Admin = 'admin',
}

export class Users extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findByPublicId(publicId: string): Promise<UserDataWithBalance> {
		const users = await this._find<UserDataWithBalance[]>(
			`SELECT u.*, b.value FROM users u LEFT JOIN balances b ON b.user_id = u.id WHERE public_id = $1`,
			[publicId]
		);
		return users[0];
	}

	async create(publicId: string, email: string, position: string | null): Promise<UserData> {
		if (position === null) position = UserRoles.Worker;
		const result = await this._modify(
			`INSERT INTO users (public_id, role, email) VALUES ($1, $2, $3) ON CONFLICT (public_id) DO UPDATE SET email = $3 RETURNING *`,
			[publicId, position, email]
		);
		return result.rows[0];
	}

	async upsert(publicId: string, email: string, position: string | null): Promise<UserData> {
		if (position === null) position = UserRoles.Worker;
		const q = `INSERT INTO users (public_id, email, role) VALUES ($1, $2, $3) ON CONFLICT (public_id) DO UPDATE SET email=$2, role=$3 RETURNING *`;
		const res = await this._modify(q, [publicId, email, position]);
		return res.rows[0];
	}

	async changeRole(user: UserData, role: string) {
		user.role = role;
		const q = `UPDATE users SET role=$1 WHERE public_id=$2`;
		const res = await this._modify(q, [role, user.public_id]);
		return res.rows[0];
	}
}
