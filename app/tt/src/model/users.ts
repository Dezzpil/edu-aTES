import { Pool } from 'pg';
import { Model } from '../model';

export interface UserData {
	id: string;
	login: string;
	password: string;
	role: string;
}

export enum UserRoles {
	Worker = 'worker',
	Manager = 'manager',
	Admin = 'admin',
}

export class Users extends Model {
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
}
