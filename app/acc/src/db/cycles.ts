import { AbstractModel } from './model';
import { Pool } from 'pg';

export interface CycleData {
	id: number;
	is_closed: boolean;
	created_at: number;
	closed_at: number | null;
}

export class Cycles extends AbstractModel {
	constructor(props: Pool) {
		super(props);
	}

	async close(): Promise<CycleData> {
		const qs = [
			`UPDATE cycles SET is_closed = true, closed_at = current_timestamp WHERE is_closed = false`,
			`INSERT INTO cycles DEFAULT VALUES RETURNING *`,
		];
		const res = await this._modify(qs, []);
		return res.rows[0];
	}
}
