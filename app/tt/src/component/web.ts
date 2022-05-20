import express = require('express');
import { UserData, Users } from '../db/users';
import { randomInt } from 'crypto';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { Tasks } from '../db/tasks';
import { Pool } from 'pg';
import { Channel } from 'amqplib';
import { queueTaskBE, queueTaskCUD } from '../events';
import { toJSON } from '../../../esr/event';
import { DataTaskCreated1 } from '../../../esr/events/task/created/1';
import { DataTaskCompleted1 } from '../../../esr/events/task/completed/1';
import { DataTaskReassign1 } from '../../../esr/events/task/reassign/1';
import ClientOAuth2 from 'client-oauth2';
import session from 'express-session';
import bodyParser from 'body-parser';

const cors = require('cors');
const axios = require('axios').default;

export const web = async (pool: Pool, ch: Channel, oauth: ClientOAuth2) => {
	await ch.assertQueue(queueTaskBE);
	await ch.assertQueue(queueTaskCUD);

	const um = new Users(pool);
	const tm = new Tasks(pool);

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
		let user: UserData;
		try {
			user = await getAuthedUser(req);
		} catch (e) {
			const authorizeUrl = oauth.code.getUri();
			res.end(`<a href="${authorizeUrl}">Login</a>`);
			return;
		}

		const workers = await um.findWorkers();
		const tasks = await tm.findForUser(user);
		const out = await twing.render('index.twig', { user, tasks, workers });
		res.end(out);
		res.end('/');
	});

	app.post('/task', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка параметров
		const task = await tm.create(user, req.body.desc, req.body.workerId);

		// TODO перейти на версию 2
		const json = toJSON('TaskCreated', 1, {
			public_id: task.public_id,
			description: task.description,
			account_public_id: task.assigned_to,
		} as DataTaskCreated1);
		if (!ch.sendToQueue(queueTaskBE, Buffer.from(json))) {
			// TODO обработка ошибок
			throw new Error('sent failed');
		}
	});

	app.post('/complete', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка принадлжености таски
		const task = await tm.findById(req.body.id);
		await tm.complete(task, user);

		const json = toJSON('TaskCompleted', 1, {
			public_id: task.public_id,
			account_public_id: task.completed_by,
		} as DataTaskCompleted1);
		if (!ch.sendToQueue(queueTaskBE, Buffer.from(json))) {
			// TODO падать плохая идея
			throw new Error('sent failed');
		}
	});

	app.post('/reassign', async (req, res) => {
		const user = await getAuthedUser(req);

		const tasks = await tm.findAllNotCompleted();
		if (tasks) {
			const users = await um.findWorkers();
			for (const task of tasks) {
				const n = randomInt(users.length);
				await tm.reassign(task, users[n]);

				const json = toJSON('TaskReassign', 1, {
					public_id: task.public_id,
					account_public_id: task.assigned_to,
				} as DataTaskReassign1);

				if (!ch.sendToQueue(queueTaskBE, Buffer.from(json))) {
					// TODO падать плохая идея
					throw new Error('sent failed');
				}
			}
		}
	});

	app.listen(3001);
	return app;
};
