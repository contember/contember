import { DatabaseContext, SchemaProvider, SchemaWithMeta } from '@contember/engine-system-api'
import { filterSchemaByStage } from '@contember/schema-utils'

export class ContentSchemaResolver {
	private baseSchemaCache: SchemaWithMeta | null = null
	private stageSchemaCache: { [stage: string]: SchemaWithMeta } = {}

	constructor(private readonly schemaProvider: SchemaProvider) {
	}

	public clearCache() {
		this.baseSchemaCache = null
		this.stageSchemaCache = {}
	}

	public async getSchema(db: DatabaseContext, stage?: string): Promise<SchemaWithMeta> {
		const prevBaseSchema = this.baseSchemaCache
		this.baseSchemaCache = await this.schemaProvider.fetch(db, prevBaseSchema)
		if (prevBaseSchema !== this.baseSchemaCache) {
			this.stageSchemaCache = {}
		}

		if (!stage) {
			return this.baseSchemaCache
		}
		return this.stageSchemaCache[stage] ??= {
			...this.baseSchemaCache,
			schema: filterSchemaByStage(this.baseSchemaCache.schema, stage),
		}
	}
}
