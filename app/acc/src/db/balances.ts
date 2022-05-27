import { AbstractModel } from './model';
import { Pool } from 'pg';

export interface BalanceData {
	user_id: number;
	balance: number;
}

export class Balances extends AbstractModel {
	constructor(props: Pool) {
		super(props);
	}

	async findForAll(): Promise<BalanceData[]> {
		const q = `SELECT * FROM balances`;
		return this._find<BalanceData[]>(q, [], false);
	}
}
