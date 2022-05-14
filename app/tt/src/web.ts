import express = require('express');
import { UserData, Users } from './model/users';
import { randomInt } from 'crypto';
import { TwingEnvironment, TwingLoaderFilesystem } from 'twing';
import { Tasks } from './model/tasks';
import { Pool } from 'pg';

export const web = (pool: Pool, client: any) => {
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

		// TODO Task.Created
	});

	app.post('/complete', async (req, res) => {
		const user = await getAuthedUser(req);

		// TODO проверка принадлжености таски
		const task = await tm.findById(req.body.id);
		await tm.complete(task, user);

		// TODO Task.Completed
	});

	app.post('/reassign', async (req, res) => {
		const user = await getAuthedUser(req);

		const tasks = await tm.findAllNotCompleted();
		if (tasks) {
			const users = await um.findWorkers();
			for (const task of tasks) {
				const n = randomInt(users.length);
				tm.reassign(task, users[n]);
				// TODO Task.Reassign
			}
		}
	});

	app.listen(3001);

	return app;
};
