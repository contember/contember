import { MigrationFileLoader } from './MigrationFileLoader.js'
import * as fs from 'node:fs/promises'
import { MigrationParser } from './MigrationParser.js'
import { MigrationFile } from './MigrationFile.js'

export class JsonLoader implements MigrationFileLoader {
	constructor(
		private readonly migrationParser: MigrationParser,
	) {
	}

	public async load(file: MigrationFile) {
		return this.migrationParser.parse(
			file,
			JSON.parse(await fs.readFile(file.path, { encoding: 'utf8' })),
		)
	}
}
