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
import { request } from 'http';

export const web = async (pool: Pool, ch: Channel, oauth: ClientOAuth2) => {
	let accessToken: string;

	await ch.assertQueue(queueTaskBE);
	await ch.assertQueue(queueTaskCUD);

	const um = new Users(pool);
	const tm = new Tasks(pool);

	const loader = new TwingLoaderFilesystem(__dirname + '/../view');
	const twing = new TwingEnvironment(loader);
	const app = express();

	async function getAuthedUser(req: express.Request): Promise<UserData> {
		console.log(accessToken); //=> { accessToken: '...', tokenType: 'bearer', ... }

		const options = {
			hostname: '127.0.0.1',
			port: 3000,
			path: '/oauth/authorize',
			method: 'GET',
			headers: {
				Authorize: `Bearer ${accessToken}`,
				Accept: 'application/json',
			},
		};
		return new Promise((resolve, reject) => {
			const req = request(options, async res => {
				let output = '';
				res.on('data', chunk => {
					output = output + chunk.toString();
				});
				res.on('end', async () => {
					console.log(output);
					resolve(await um.findAnyAdmin());
				});
			});
			req.on('error', error => {
				console.error(error);
				reject(error);
			});
			req.end();
		});
	}

	app.get('/', async (req: express.Request, res: express.Response) => {
		console.log(req.cookies);

		// const user = await getAuthedUser(req);
		// const workers = await um.findWorkers();
		// const tasks = await tm.findForUser(user);
		// const out = await twing.render('index.twig', { user, tasks, workers });
		// res.end(out);
		res.end('/');
	});

	app.get('/auth', (req: express.Request, res: express.Response) => {
		res.redirect(oauth.code.getUri());
	});

	app.get('/auth/redirect', async (req: express.Request, res: express.Response) => {
		const token = await oauth.code.getToken(req.originalUrl);
		console.log(token); //=> { accessToken: '...', tokenType: 'bearer', ... }

		// Refresh the current users access token.
		try {
			const updatedToken = await token.refresh();
			console.log(updatedToken !== token); //=> true
			console.log(updatedToken.accessToken);
		} catch (e: any) {
			console.error(e);
		}

		// Sign API requests on behalf of the current user.
		token.sign({
			method: 'get',
			url: 'http://127.0.0.1:3001',
		});

		// TODO We should store the token into a database.
		accessToken = token.accessToken;
		res.send(token.accessToken);
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
