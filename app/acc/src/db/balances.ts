import { AbstractModel } from './model';
import { Pool } from 'pg';
import { UserData } from './users';

export interface BalanceData {
	id: number;
}

export class Balances extends AbstractModel {
	constructor(_pool: Pool) {
		super(_pool);
	}

	async findForUser(user: UserData): Promise<BalanceData | null> {
		const q = `SELECT * FROM balances WHERE user_id=$1`;
		const res = await this._find<BalanceData[]>(q, [user.id], false);
		return res.length ? res[0] : null;
	}

	async create(user: UserData): Promise<BalanceData> {
		const q = `INSERT INTO balances (user_id) VALUES ($1) RETURNING *`;
		const params = [user.id];
		const result = await this._modify(q, params);
		return result.rows[0] as BalanceData;
	}
}
