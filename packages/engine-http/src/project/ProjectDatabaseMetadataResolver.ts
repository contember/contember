import { DatabaseMetadata, DatabaseMetadataResolver } from '@contember/database'
import { DatabaseContext } from '@contember/engine-system-api'
import { Schema } from '@contember/schema'

export class ProjectDatabaseMetadataResolver {

	private cache: WeakMap<Schema, Map<string, DatabaseMetadata>> = new WeakMap()

	constructor(
		private resolver: DatabaseMetadataResolver,
	) {
	}

	async resolveDatabaseMetadata(db: DatabaseContext, schema: Schema, stageSchema: string): Promise<DatabaseMetadata> {
		let schemaCache = this.cache.get(schema)
		if (!schemaCache) {
			schemaCache = new Map()
			this.cache.set(schema, schemaCache)
		}
		const cachedMeta = schemaCache.get(stageSchema)
		if (cachedMeta) {
			return cachedMeta
		}
		const metadata = await this.resolver.resolveMetadata(db.client, stageSchema)
		schemaCache.set(stageSchema, metadata)

		return metadata
	}
}
