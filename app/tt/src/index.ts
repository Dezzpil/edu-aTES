import { Pool } from 'pg';
import client from 'amqplib';
import { web } from './component/web';
import { users } from './component/users';

(async () => {
	const pool = new Pool({
		user: 'postgres',
		password: 'postgres',
	});

	const conn = await client.connect('amqp://127.0.0.1:5672');
	const ch = await conn.createChannel();

	await users(pool, ch);
	await web(pool, ch);
})();
