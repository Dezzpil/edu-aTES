import { fromJSON, toJSON } from './event';
import { nanoid } from 'nanoid';

describe('toJSON', () => {
	it('should throw error no event_*', async () => {
		expect(() => {
			fromJSON('{}');
		}).toThrow(/bad syntax/);
	});
	it('should throw error no schema for *', async () => {
		expect(() => {
			fromJSON('{ "event_name": "FooBared", "event_version": 1 }');
		}).toThrow(/no schema for/);
	});
	it('should throw envelope validation error ', async () => {
		expect(() => {
			const event = {
				event_name: 'TaskCreated',
				event_version: 1,
			};
			fromJSON(JSON.stringify(event));
		}).toThrow(/missingProperty: '.*?'/);
	});
	it('should throw data validation error ', async () => {
		expect(() => {
			const event = {
				event_name: 'TaskCreated',
				event_version: 1,
				event_time: Date.now() + '',
				event_id: '1',
				producer: 'someone',
				data: {
					foo: 'bar',
				},
			};
			fromJSON(JSON.stringify(event));
		}).toThrow(/missingProperty: 'account_public_id'/);
	});
	it('should throw data validation error ', async () => {
		expect(() => {
			const event = {
				event_name: 'TaskCreated',
				event_version: 1,
				event_time: Date.now() + '',
				event_id: '1',
				producer: 'someone',
				data: {
					public_id: 'pew',
					description: 'pew',
					account_public_id: 1,
				},
			};
			fromJSON(JSON.stringify(event));
		}).toThrow(/must be string/);
	});
	it('should create event', async () => {
		const data = {
			event_name: 'TaskCreated',
			event_version: 1,
			event_time: Date.now() + '',
			event_id: '1',
			producer: 'someone',
			data: {
				public_id: 'pew',
				description: 'pew',
				account_public_id: 'foo',
			},
		};
		const event = fromJSON(JSON.stringify(data));
		expect(event).toEqual(data);
	});
});

describe('toJSON', () => {
	it('should return string', async () => {
		const output = toJSON('TaskCreated', 1, {
			public_id: nanoid(),
			account_public_id: 'foo',
			description: '...',
		});
		expect(output).toMatch(/event_id/);
	});
});
