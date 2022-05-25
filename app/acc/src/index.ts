import { Pool } from 'pg';
import client from 'amqplib';
import { users } from './component/users';
import { tasks } from './component/tasks';
import { web } from './component/web';

(async () => {
	// TODO add dotenv
	// TODO move all values to .env

	const pool = new Pool({
		user: 'postgres',
		password: 'postgres',
		port: 5435,
	});

	const ClientOAuth2 = require('client-oauth2');
	const oauth = new ClientOAuth2({
		clientId: '_iHixoCzy7m06sWfVrzsDv3KNDJXGUqWUlgShMfZWgA',
		clientSecret: 'bye9QDyIXcBWoDxUIlA4y6J27x4xF2CVVhNg5z1pbS4',
		accessTokenUri: 'http://127.0.0.1:3000/oauth/token',
		authorizationUri: 'http://127.0.0.1:3000/oauth/authorize',
		redirectUri: 'http://127.0.0.1:3002/auth/redirect',
		scopes: ['public'],
	});

	const conn = await client.connect('amqp://127.0.0.1:5672');
	const ch = await conn.createChannel();

	await users(pool, ch);
	await tasks(pool, ch);
	await web(pool, ch, oauth);
})();
