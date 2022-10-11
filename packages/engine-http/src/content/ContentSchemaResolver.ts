import { DatabaseContext, SchemaVersionBuilder, VersionedSchema } from '@contember/engine-system-api'
import { filterSchemaByStage } from '@contember/schema-utils'


export class ContentSchemaResolver {
	private baseSchemaCache: VersionedSchema | undefined
	private stageSchemaCache: { [stage: string]: VersionedSchema } = {}

	constructor(private readonly schemaVersionBuilder: SchemaVersionBuilder) {
	}

	public clearCache() {
		this.baseSchemaCache = undefined
		this.stageSchemaCache = {}
	}

	public async getSchema(db: DatabaseContext, stage?: string): Promise<VersionedSchema> {
		const prevBaseSchema = this.baseSchemaCache
		this.baseSchemaCache = await this.schemaVersionBuilder.buildSchema(db, prevBaseSchema)
		if (prevBaseSchema !== this.baseSchemaCache) {
			this.stageSchemaCache = {}
		}
		if (!stage) {
			return this.baseSchemaCache
		}
		return this.stageSchemaCache[stage] ??= filterSchemaByStage(this.baseSchemaCache, stage)
	}
}
