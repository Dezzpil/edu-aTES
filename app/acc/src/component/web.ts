import express = require('express');
import { UserData, UserRoles, Users } from '../db/users';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { Pool } from 'pg';
import { Channel, Connection } from 'amqplib';
import ClientOAuth2 from 'client-oauth2';
import session from 'express-session';
import bodyParser from 'body-parser';
import { resolve } from 'path';
import { Transactions } from '../db/transactions';
import { inspect } from 'util';
import { Cycles } from '../db/cycles';
import { toJSON } from '../../../esr/event';
import { DataTaskCreated1 } from '../../../esr/events/task/created/1';
import { ExchangeBillingCUD, ExchangeTasksCUD } from '../../../esr/names';
import { DataBillingCycleClosed1 } from '../../../esr/events/billing-cycle/closed/1';
import { Balances } from '../db/balances';

const cors = require('cors');
const axios = require('axios').default;

export const web = async (pool: Pool, conn: Connection, oauth: ClientOAuth2) => {
	const um = new Users(pool);
	const trm = new Transactions(pool);
	const cm = new Cycles(pool);
	const bm = new Balances(pool);

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
			saveUninitialized: false,
			cookie: { secure: false, sameSite: true },
			secret: 'lalaley',
		})
	);

	let token: string;

	// TODO дублируется в tt и здесь
	const getAuthedUser = async (req: express.Request): Promise<UserData> => {
		const s = req.session as any;
		// console.log(s);
		if ('public_id' in s) {
			return await um.findByPublicId(s.public_id);
		}
		if ('token' in s) {
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

	app.get('/auth/redirect', async (req: express.Request, res: express.Response) => {
		console.log(req.originalUrl);
		const result = await oauth.code.getToken(req.originalUrl);
		token = result.accessToken;

		// @ts-ignore
		req.session.token = token;
		res.redirect('/');
	});

	app.get('/', async (req: express.Request, res: express.Response) => {
		console.log(req.originalUrl);
		// if (!token) {
		// 	res.redirect('/auth/redirect?hello');
		// }
		let user: UserData;
		try {
			user = await getAuthedUser(req);
		} catch (e) {
			console.log(e);
			const authorizeUrl = oauth.code.getUri();
			const out = await twing.render('login.twig', { authorizeUrl });
			res.end(out);
			return;
		}

		const context = {
			user: inspect(user),
			transactions: [] as any[],
		};

		let name: string;
		if (user.role === UserRoles.Worker) {
			name = 'workers.twig';
			context.transactions = await trm.findForWorker(user);
		} else {
			name = 'management.twig';
			context.transactions = await trm.findAggForManagement();
		}

		res.end(await twing.render(name, context));
		res.end('/');
	});

	const chCUD = await conn.createChannel();
	await chCUD.assertExchange(ExchangeBillingCUD, 'fanout', { durable: false });

	app.post('/close', async (req, res) => {
		// TODO проверка прав пользователя
		const user = await getAuthedUser(req);
		const balances = await bm.findForAll();

		// TODO для всех балансов, у которых > 0 мы делаем выплаты
		// TODO для всех балансов, у которых < 0 мы погашаем задолженность

		const cycle = await cm.close();

		// TODO для всех должников мы формируем списываем долг в новом цикле

		const json = toJSON('BillingCycleClosed', 1, {
			id: cycle.id + '',
		} as DataBillingCycleClosed1);
		if (!chCUD.publish(ExchangeBillingCUD, '', Buffer.from(json))) {
			// TODO обработка ошибок
			throw new Error('sent failed');
		}
		console.log(`event BillingCycleClosed published`);

		res.redirect('/');
	});

	app.listen(3002);
	console.log(`app is listening at 3002`);
	return app;
};
