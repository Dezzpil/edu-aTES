import express = require('express');
import { UserData, UserRoles, Users } from '../db/users';
import { randomInt } from 'crypto';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { Tasks } from '../db/tasks';
import { Pool } from 'pg';
import { Connection } from 'amqplib';
import { toJSON } from '../../../esr/event';
import { DataTaskCreated1 } from '../../../esr/events/task/created/1';
import { DataTaskCompleted1 } from '../../../esr/events/task/completed/1';
import { DataTaskReassign1 } from '../../../esr/events/task/reassign/1';
import ClientOAuth2 from 'client-oauth2';
import session from 'express-session';
import bodyParser from 'body-parser';
import { resolve } from 'path';
import { inspect } from 'util';
import { ExchangeTasksBE, ExchangeTasksCUD } from '../../../esr/names';

const cors = require('cors');
const axios = require('axios').default;

export const web = async (pool: Pool, conn: Connection, oauth: ClientOAuth2) => {
	const um = new Users(pool);
	const tm = new Tasks(pool);

	const chCUD = await conn.createChannel();
	await chCUD.assertExchange(ExchangeTasksCUD, 'fanout', { durable: false });

	const chBE = await conn.createChannel();
	await chBE.assertExchange(ExchangeTasksBE, 'fanout', { durable: false });

	const getAuthedUser = async (req: express.Request): Promise<UserData> => {
		const s = req.session as any;
		if ('public_id' in s) {
			return await um.findById(s.public_id);
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
			return await um.findById(s.public_id);
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
			secret: 'hophey',
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
		console.log('/');
		let user: UserData;
		try {
			user = await getAuthedUser(req);
		} catch (e) {
			const authorizeUrl = oauth.code.getUri();
			const out = await twing.render('login.twig', { authorizeUrl });
			res.end(out);
			return;
		}

		const notWorker = user.role !== UserRoles.Worker;
		const workers = await (notWorker ? um.findWorkers() : []);
		const tasks = await (notWorker ? tm.findAllNotCompleted() : tm.findNonCompletedForUser(user));
		const out = await twing.render('index.twig', {
			notWorker,
			workers,
			tasks,
			userStr: inspect(user),
			user,
		});
		res.end(out);
		res.end('/');
	});

	app.post('/create', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка параметров
		const task = await tm.create(user, req.body.desc, req.body.workerId);

		// TODO перейти на версию 2
		const json = toJSON('TaskCreated', 1, {
			public_id: task.public_id,
			description: task.description,
			account_public_id: task.assigned_to,
		} as DataTaskCreated1);
		if (!chCUD.publish(ExchangeTasksCUD, '', Buffer.from(json))) {
			// TODO обработка ошибок
			throw new Error('sent failed');
		}
		console.log(`event TaskCreated published`);
		res.redirect('/');
	});

	app.post('/complete', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка принадлежности таски
		let task = await tm.findById(req.body.id);
		task = await tm.complete(task, user);

		const json = toJSON('TaskCompleted', 1, {
			public_id: task.public_id,
			account_public_id: task.completed_by,
		} as DataTaskCompleted1);
		if (!chBE.publish(ExchangeTasksBE, '', Buffer.from(json))) {
			// TODO падать плохая идея
			throw new Error('sent failed');
		}
		console.log(`event TaskCompleted published`);
		res.redirect('/');
	});

	app.post('/reassign', async (req, res) => {
		const user = await getAuthedUser(req);

		const tasks = await tm.findAllNotCompleted();
		if (tasks) {
			const users = await um.findWorkers();
			for (const task of tasks) {
				const n = randomInt(users.length);
				const reassigned = await tm.reassign(task, users[n]);

				const json = toJSON('TaskReassign', 1, {
					public_id: reassigned.public_id,
					account_public_id: reassigned.assigned_to,
				} as DataTaskReassign1);

				if (!chBE.publish(ExchangeTasksBE, '', Buffer.from(json))) {
					// TODO падать плохая идея
					throw new Error('sent failed');
				}
				console.log(`event TaskReassign published`);
			}
		}
		res.redirect('/');
	});

	app.listen(3001);
	console.log(`app is listening at 3001`);

	return app;
};
