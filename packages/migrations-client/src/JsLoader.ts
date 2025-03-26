import { MigrationFileLoader } from './MigrationFileLoader'
import { MigrationParser } from './MigrationParser'
import { ContentMigration, ContentMigrationFactoryArgs, MigrationContent, MigrationFile } from './MigrationFile'

export class JsLoader implements MigrationFileLoader {
	constructor(
		private readonly migrationParser: MigrationParser,
		private readonly jsExecutor: (file: string) => Promise<any>,
	) {
	}


	public async load(file: MigrationFile): Promise<MigrationContent> {
		const exports = await this.jsExecutor(file.path)
		if (!('default' in exports) && !('query' in exports) && !('queries' in exports)) {
			throw `export "default" or "query" is required in ${file.path}`
		}
		if (typeof exports.default !== 'function') {
			return this.migrationParser.parse(file, exports.default || exports)
		}

		return {
			type: 'factory',
			factory: async (args: ContentMigrationFactoryArgs): Promise<ContentMigration> => {
				const result = await exports.default(args)
				const migration = this.migrationParser.parse(file, result ?? { queries: [] })
				if (migration.type !== 'content') {
					throw new Error()
				}
				return migration
			},

		}
	}
}
