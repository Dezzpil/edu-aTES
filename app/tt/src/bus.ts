import { Pool } from 'pg';

export const bus = (pool: Pool) => {
	// TODO подключиться к рэббиту и начать читать сообщения от auth
	// TODO возвращать клиента, чтобы можно было стримить сообщения из web
};
