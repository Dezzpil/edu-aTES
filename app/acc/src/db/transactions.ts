import { AbstractModel } from './model';
import { Pool } from 'pg';
import { TaskData } from './tasks';
import { UserData, UserRoles } from './users';

export enum TransactionType {
	Transfer = 0, // перевод средств
	Enrollment = 1, // зачисление средств
	Withdrawal = 2, // списание средств
	Payment = 3, // выплата
}

export interface TransactionData {
	id: number;
	created_at: number;
	debit: number;
	credit: number;
	user_id: number;
	type: TransactionType;
	task_id: number | null;
}

export interface ManagementDebitSum {
	user_id: number;
	count: number;
	debit: number;
}

export class Transactions extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async enroll(to: UserData, task: TaskData): Promise<TransactionData> {
		const q = `INSERT INTO transactions (user_id, type, task_id, debit) VALUES ($1, $2, $3, $4) RETURNING *`;
		const res = await this._modify(q, [to.id, TransactionType.Enrollment, task.id, task.price]);
		return res.rows[0];
	}

	// async transfer(from: UserData, to: UserData, task: TaskData, value: number): Promise<TransactionData[]> {
	// 	const q = `INSERT INTO transactions (user_id, type, task_id, debit, credit) VALUES ($1, $3, $4, 0, $5),($1, $3, $4, $5,0) RETURNING *`;
	// 	const p = [from.id, to.id, TransactionType.Transfer, task.id, value];
	// 	const res = await this._modify(q, p);
	// 	return res.rows;
	// }

	async withdraw(from: UserData, task: TaskData, value: number): Promise<TransactionData> {
		const q = `INSERT INTO transactions (user_id, type, task_id, debit) VALUES ($1, $2, $3, $4) RETURNING *`;
		const res = await this._modify(q, [from.id, TransactionType.Withdrawal, task.id, value]);
		return res.rows[0];
	}

	async payment(to: UserData, value: number): Promise<TransactionData> {
		const q = `INSERT INTO transactions (user_id, type, credit) VALUES ($1, $2, $3) RETURNING *`;
		const res = await this._modify(q, [to.id, TransactionType.Payment, value]);
		return res.rows[0];
	}

	async findForWorker(user: UserData): Promise<TransactionData[]> {
		const q = `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`;
		return this._find<TransactionData[]>(q, [user.id], false);
	}

	async findAggForManagement(): Promise<ManagementDebitSum[]> {
		const q = `SELECT t.user_id as user_id, COUNT(*) as count, SUM(t.debit) FROM transactions t LEFT JOIN users u ON t.user_id = u.id WHERE u.role = $1 GROUP BY t.user_id`;
		return this._find<ManagementDebitSum[]>(q, [UserRoles.Manager], false);
	}
}
