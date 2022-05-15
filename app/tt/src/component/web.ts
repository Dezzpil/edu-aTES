import express = require('express');
import { UserData, Users } from '../db/users';
import { randomInt } from 'crypto';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { Tasks } from '../db/tasks';
import { Pool } from 'pg';
import { Channel } from 'amqplib';
import { createEvent, queueTaskBE, queueTaskCUD } from '../events';

export const web = async (pool: Pool, ch: Channel) => {
	await ch.assertQueue(queueTaskBE);
	await ch.assertQueue(queueTaskCUD);

	const um = new Users(pool);
	const tm = new Tasks(pool);

	const loader = new TwingLoaderFilesystem('view');
	const twing = new TwingEnvironment(loader);
	const app = express();

	function getAuthedUser(req: express.Request): Promise<UserData> {
		// TODO узнать id из токена и найти пользователя
		return um.findAnyAdmin();
	}

	app.get('/', async (req: express.Request, res: express.Response) => {
		const user = await getAuthedUser(req);
		const workers = await um.findWorkers();
		const tasks = await tm.findForUser(user);
		const out = await twing.render('index.twig', { user, tasks, workers });
		res.end(out);
	});

	app.post('/task', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка параметров
		const task = await tm.create(user, req.body.desc, req.body.workerId);

		const event = createEvent('TaskCreated', {
			id: task.id,
			description: task.description,
			worker_id: task.assigned_to,
		});
		if (!ch.sendToQueue(queueTaskBE, Buffer.from(JSON.stringify(event)))) {
			// TODO падать плохая идея
			throw new Error('sent failed');
		}
	});

	app.post('/complete', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка принадлжености таски
		const task = await tm.findById(req.body.id);
		await tm.complete(task, user);

		const event = createEvent('TaskCompleted', {
			id: task.id,
			worker_id: task.completed_by,
		});
		if (!ch.sendToQueue(queueTaskBE, Buffer.from(JSON.stringify(event)))) {
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

				const event = createEvent('TaskReassign', {
					id: task.id,
					worker_id: task.assigned_to,
				});
				if (!ch.sendToQueue(queueTaskBE, Buffer.from(JSON.stringify(event)))) {
					// TODO падать плохая идея
					throw new Error('sent failed');
				}
			}
		}
	});

	app.listen(3001);
	return app;
};
