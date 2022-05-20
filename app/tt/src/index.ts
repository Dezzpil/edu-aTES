import { Pool } from 'pg';
import client from 'amqplib';
import { web } from './component/web';
import { users } from './component/users';

(async () => {
	const pool = new Pool({
		user: 'postgres',
		password: 'postgres',
		port: 5434,
	});

	const conn = await client.connect('amqp://127.0.0.1:5672');
	const ch = await conn.createChannel();

	const ClientOAuth2 = require('client-oauth2');
	// TODO move to .env
	const oauth = new ClientOAuth2({
		clientId: '-4FHT4X4PXYuYt5UwxIXxCvu-frigWWAcJl5H_pF9vU',
		clientSecret: 'RRfLg1-VT_wKaJKpedcZFMewJSH4VZURLVZ3__fVi9E',
		accessTokenUri: 'http://127.0.0.1:3000/oauth/token',
		authorizationUri: 'http://127.0.0.1:3000/oauth/authorize',
		redirectUri: 'http://127.0.0.1:3001/auth/redirect',
		scopes: ['public'],
	});

	await users(pool, ch);
	await web(pool, ch, oauth);
})();
