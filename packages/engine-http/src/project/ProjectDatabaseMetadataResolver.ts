import { DatabaseContext, SchemaDatabaseMetadataResolver } from '@contember/engine-system-api'
import { Schema } from '@contember/schema'
import { SchemaDatabaseMetadata } from '@contember/schema-utils'

export class ProjectDatabaseMetadataResolver {

	private cache: WeakMap<Schema, Map<string, SchemaDatabaseMetadata>> = new WeakMap()

	constructor(
		private resolver: SchemaDatabaseMetadataResolver,
	) {
	}

	async resolveDatabaseMetadata(db: DatabaseContext, schema: Schema, stageSchema: string): Promise<SchemaDatabaseMetadata> {
		let schemaCache = this.cache.get(schema)
		if (!schemaCache) {
			schemaCache = new Map()
			this.cache.set(schema, schemaCache)
		}
		const cachedMeta = schemaCache.get(stageSchema)
		if (cachedMeta) {
			return cachedMeta
		}
		const metadata = await this.resolver.resolveMetadata(db, stageSchema)
		schemaCache.set(stageSchema, metadata)

		return metadata
	}
}
