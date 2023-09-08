import { MigrationFileLoader } from './MigrationFileLoader'
import { buildJs } from '../esbuild'
import { MigrationParser } from './MigrationParser'
import { ContentMigration, MigrationContent, MigrationFile } from './MigrationFile'

export class JsLoader implements MigrationFileLoader {
	constructor(
		private readonly migrationParser: MigrationParser,
	) {
	}


	public async load(file: MigrationFile): Promise<MigrationContent> {
		const code = await buildJs(file.path)
		const fn = new Function(`var module = {}; ((module) => { ${code} })(module); return module`)
		const exports = fn().exports
		if (!('default' in exports) && !('query' in exports) && !('queries' in exports)) {
			throw `export "default" or "query" is required in ${file.path}`
		}
		if (typeof exports.default !== 'function') {
			return this.migrationParser.parse(file, exports.default || exports)
		}

		return {
			type: 'factory',
			factory: async (): Promise<ContentMigration> => {
				const result = await exports.default()
				const migration = this.migrationParser.parse(file, result ?? { queries: [] })
				if (migration.type !== 'content') {
					throw new Error()
				}
				return migration
			},

		}
	}
}
