import { nanoid } from 'nanoid';
import { readdirSync, readFileSync } from 'fs';
import { SCHEMAS_DIR } from './build';
import { inspect } from 'util';
import { join } from 'path';
import { ValidateFunction } from 'ajv';
const Ajv = require('ajv');
const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}

const schemas = new Map();
readdirSync(SCHEMAS_DIR).forEach(file => {
	const content = readFileSync(join(SCHEMAS_DIR, file));
	const json = JSON.parse(content.toString());
	schemas.set(file, ajv.compile(json));
});

export interface Event {
	event_id: string;
	event_version: number;
	event_name: string;
	event_time: string;
	producer: string;
	data: {};
}

function getValidateFn(name: string, version: number): ValidateFunction {
	const schemaName = `${name}${version}`;
	const schemaFileName = `${schemaName}.json`;
	if (!schemas.has(schemaFileName)) throw new Error(`no schema for ${schemaName}`);
	return schemas.get(schemaFileName);
}

export function toJSON(name: string, version: number, data: Record<string, any>): string {
	const validateFn = getValidateFn(name, version);
	const event = {
		event_id: nanoid(),
		event_name: name,
		event_time: Date.now() + '',
		event_version: version,
		producer: '?',
		data,
	};
	if (!validateFn(event)) {
		throw new Error(`validate errors: ${inspect(validateFn.errors)}`);
	}
	return JSON.stringify(event);
}

export function fromJSON<T>(input: string): T {
	const event = JSON.parse(input);
	if ('event_name' in event && 'event_version' in event) {
		const validateFn = getValidateFn(event.event_name, event.event_version);
		if (!validateFn(event)) {
			throw new Error(`validate errors: ${inspect(validateFn.errors)}`);
		}
		return event as T;
	} else {
		throw new Error(`bad syntax: no 'event_name' or 'event_version' in data`);
	}
}
