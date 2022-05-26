import express = require('express');
import { UserData, UserRoles, Users } from '../db/users';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { Pool } from 'pg';
import { Channel } from 'amqplib';
import ClientOAuth2 from 'client-oauth2';
import session from 'express-session';
import bodyParser from 'body-parser';
import { resolve } from 'path';
import { Transactions } from '../db/transactions';
import { inspect } from 'util';

const cors = require('cors');
const axios = require('axios').default;

export const web = async (pool: Pool, ch: Channel, oauth: ClientOAuth2) => {
	const um = new Users(pool);
	const trm = new Transactions(pool);

	// TODO вынести в библиотеку, т.к. дублируется в tt и здесь
	const getAuthedUser = async (req: express.Request): Promise<UserData> => {
		const s = req.session as any;
		if ('public_id' in s) {
			console.log('get public_id in session');
			return await um.findByPublicId(s.public_id);
		}
		if ('token' in s) {
			console.log('get token in session');
			const url = 'http://127.0.0.1:3000/accounts/current.json';
			const result = await axios.get(url, {
				headers: {
					Authorization: `Bearer ${s.token}`,
				},
				withCredentials: true,
			});
			if (result.data === null) throw new Error('no data for current user by token');
			s.public_id = result.data.public_id;
			return await um.findByPublicId(s.public_id);
		}

		throw new Error(`no token`);
	};

	const loader = new TwingLoaderFilesystem(__dirname + '/../view');
	const twing = new TwingEnvironment(loader);
	const app = express();

	const staticPath = resolve(__dirname + '../../../public');

	app.use(express.static(staticPath));
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());
	app.use(cors({ credentials: true, origin: '*' }));
	app.use(
		session({
			resave: true,
			saveUninitialized: true,
			cookie: { secure: false, sameSite: false },
			secret: 'lalaley',
			rolling: true,
		})
	);

	let token: string;

	app.get('/auth/redirect', async (req: express.Request, res: express.Response) => {
		console.log('/auth/redirect');
		const result = await oauth.code.getToken(req.originalUrl);
		token = result.accessToken;

		// @ts-ignore
		req.session.token = token;

		console.log(`Token saved: ${result.accessToken}`);
		res.redirect('/');
	});

	app.get('/', async (req: express.Request, res: express.Response) => {
		let user: UserData;
		try {
			user = await getAuthedUser(req);
		} catch (e) {
			console.error(e);
			const authorizeUrl = oauth.code.getUri();
			const out = await twing.render('login.twig', { authorizeUrl });
			res.end(out);
			return;
		}

		const context = {
			user: inspect(user),
			transactions: inspect([]),
		};

		let name: string;
		if (user.role === UserRoles.Worker) {
			name = 'workers.twig';
			context.transactions = inspect(await trm.findForWorker(user));
		} else {
			name = 'management.twig';
			context.transactions = inspect(await trm.findAggForManagement());
		}

		res.end(await twing.render(name, context));
		res.end('/');
	});

	app.listen(3002);
	console.log(`app is listening at 3002`);
	return app;
};
