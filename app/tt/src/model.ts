import { Pool, QueryResult } from 'pg';

export abstract class Model {
	protected constructor(protected _pool: Pool) {}

	// TODO можно переписать на await this._pool.connect() - станет читаемо
	protected async _find<T>(q: string, params?: any[]): Promise<T> {
		return new Promise((resolve, reject) => {
			this._pool.connect(async (err, client, release) => {
				if (err) {
					reject(err);
				} else {
					try {
						const result = await client.query(q, params ? params : []);
						if (result.rowCount) {
							resolve(result.rows as unknown as T);
						} else {
							reject(new Error(`not found`));
						}
					} catch (e) {
						reject(e);
					} finally {
						release();
					}
				}
			});
		});
	}

	// TODO можно переписать на await this._pool.connect() - станет читаемо
	protected async _modify(q: string, params?: any[]): Promise<QueryResult> {
		return new Promise((resolve, reject) => {
			this._pool.connect(async (err, client, release) => {
				if (err) {
					reject(err);
				} else {
					try {
						const res = await client.query(q, params ? params : []);
						resolve(res);
					} catch (e) {
						reject(e);
					} finally {
						release();
					}
				}
			});
		});
	}
}
