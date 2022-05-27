import { AbstractModel } from './model';
import { Pool } from 'pg';
import { TaskData } from './tasks';
import { UserData, UserRoles } from './users';
import { CycleData, Cycles } from './cycles';

export enum TransactionType {
	Enrollment = 'enrollment', // зачисление средств
	Withdrawal = 'withdrawal', // списание средств
	Payment = 'payment', // выплата
}

export interface TransactionData {
	id: number;
	created_at: number;
	debit: number;
	credit: number;
	user_id: number;
	type: TransactionType;
	cycle_id: number;
	task_id: number | null;
}

export interface ManagementDebitSum {
	id: number;
	created_at: number;
	count: number;
	dt: number;
	ct: number;
	values: number;
}

export type TransactionDataWithTask = TransactionData & { task_desc: string; task_price: string };

export class Transactions extends AbstractModel {
	constructor(pool: Pool) {
		super(pool);
	}

	async findCycle(): Promise<CycleData> {
		const q = `SELECT id FROM cycles WHERE is_closed = false ORDER BY created_at LIMIT 1`;
		const res = await this._find<CycleData[]>(q, []);
		return res[0];
	}

	async enroll(to: UserData, task: TaskData): Promise<TransactionData> {
		const cycle = await this.findCycle();
		const q = `INSERT INTO transactions (user_id, type, task_id, debit, cycle_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
		const res = await this._modify(q, [to.id, TransactionType.Enrollment, task.id, task.price, cycle.id]);
		return res.rows[0];
	}

	async transfer(
		worker: UserData,
		assigner: UserData,
		task: TaskData,
		value: number
	): Promise<TransactionData[]> {
		const cycle = await this.findCycle();
		const q = `INSERT INTO transactions (user_id, type, task_id, debit, credit, cycle_id) VALUES ($3, $4, $1, 0, $2, $7), ($5, $6, $1, $2, 0, $7) RETURNING *`;
		const res = await this._modify(q, [
			task.id,
			value,
			worker.id,
			TransactionType.Withdrawal,
			assigner.id,
			TransactionType.Enrollment,
			cycle.id,
		]);
		return res.rows[0];
	}

	async payment(to: UserData, value: number): Promise<TransactionData> {
		const cycle = await this.findCycle();
		const q = `INSERT INTO transactions (user_id, type, credit, cycle_id) VALUES ($1, $2, $3, $4) RETURNING *`;
		const res = await this._modify(q, [to.id, TransactionType.Payment, value, cycle.id]);
		return res.rows[0];
	}

	async findForWorker(user: UserData): Promise<TransactionDataWithTask[]> {
		const q = `SELECT tr.*, t.description as task_desc, t.price as task_price
				   FROM transactions tr
							LEFT JOIN tasks t on t.id = tr.task_id
							LEFT JOIN cycles c on c.id = tr.cycle_id
				   WHERE tr.user_id = $1 AND c.is_closed = false
				   ORDER BY tr.created_at DESC`;
		return this._find<TransactionDataWithTask[]>(q, [user.id], false);
	}

	async findAggForManagement(): Promise<ManagementDebitSum[]> {
		const q = `SELECT c.id, c.created_at, COUNT(t.*) count, SUM(t.debit) dt, SUM(t.credit) ct, (SUM(t.debit) - SUM(t.credit)) value
				   FROM cycles c
							LEFT JOIN transactions t on c.id = t.cycle_id
							LEFT JOIN users u ON t.user_id = u.id
				   WHERE u.role != $1
				   GROUP BY c.id, c.created_at
				   ORDER BY c.created_at DESC`;
		return this._find<ManagementDebitSum[]>(q, [UserRoles.Worker], false);
	}
}
