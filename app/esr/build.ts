import * as TJS from 'typescript-json-schema';
import { execSync } from 'child_process';

const fs = require('fs').promises;
const path = require('path');

export const SCHEMAS_DIR = 'schemas';

export async function walk(dir: string) {
	let files = await fs.readdir(dir);
	files = await Promise.all(
		files.map(async (file: string) => {
			const filePath = path.join(dir, file);
			const stats = await fs.stat(filePath);
			if (stats.isDirectory()) return walk(filePath);
			else if (stats.isFile()) return filePath;
		})
	);

	return files.reduce((all: any[], folderContents: string) => all.concat(folderContents), []);
}

if (require.main === module) {
	(async () => {
		const files = await walk('events');
		const program = TJS.getProgramFromFiles(files, { strictNullCheck: true });
		const generator = TJS.buildGenerator(program, { required: true });
		if (!generator) throw new Error(`can not build generator`);

		const d = SCHEMAS_DIR;
		execSync(`mkdir -p ${d} && rm -f ${d}/*`);
		for (const s of generator.getUserSymbols()) {
			if (s.startsWith('Account') || s.startsWith('Task')) {
				const fp = `${d}/${s}.json`;
				await fs.writeFile(fp, JSON.stringify(generator.getSchemaForSymbol(s)));
				console.log(`${fp} generated`);
			}
		}
	})();
}
