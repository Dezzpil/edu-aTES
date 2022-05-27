import { Pool, QueryResult } from 'pg';

export abstract class AbstractModel {
	protected constructor(protected _pool: Pool) {}

	// TODO можно переписать на AWAIT this._pool.connect() - станет читаемо
	protected async _find<T>(q: string, params?: any[], throwNotFound = true): Promise<T> {
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
							if (throwNotFound) {
								reject(new Error(`not found`));
							} else {
								resolve([] as unknown as T);
							}
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

	// TODO можно переписать на AWAIT this._pool.connect() - станет читаемо
	protected async _modify(q: string | string[], params?: any[]): Promise<QueryResult> {
		return new Promise((resolve, reject) => {
			this._pool.connect(async (err, client, release) => {
				if (err) {
					reject(err);
				} else {
					try {
						if (typeof q === 'string') {
							const res = await client.query(q, params ? params : []);
							resolve(res);
						} else {
							if (q.length > 0) {
								let res;
								for (const eachQ of q) {
									res = await client.query(eachQ, params ? params : []);
								}
								resolve(res as QueryResult);
							} else {
								reject(new Error(`no query given`));
							}
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
}
