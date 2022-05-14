import { Pool } from 'pg';
import { web } from './web';
import { bus } from './bus';

const pool = new Pool({
	user: 'postgres',
	password: 'postgres',
});

const client = bus(pool);
// const app = web(pool, client);
