import { DatabaseContext, SchemaVersionBuilder, VersionedSchema } from '@contember/engine-system-api'
import { filterSchemaByStage } from '@contember/schema-utils'


export class ContentSchemaResolver {
	private prevSchema: VersionedSchema | undefined
	private schemaPromise: Promise<VersionedSchema> | undefined
	private stageSchemaCache: { [stage: string]: VersionedSchema } = {}

	constructor(private readonly schemaVersionBuilder: SchemaVersionBuilder) {
	}

	public clearCache() {
		this.prevSchema = undefined
		this.schemaPromise = undefined
		this.stageSchemaCache = {}
	}

	public async getSchema(db: DatabaseContext, stage?: string): Promise<VersionedSchema> {
		const schema = await this.getBaseSchema(db)
		if (!stage) {
			return schema
		}
		return this.stageSchemaCache[stage] ??= filterSchemaByStage(schema, stage)
	}

	private async getBaseSchema(db: DatabaseContext): Promise<VersionedSchema> {
		const prevSchema = this.prevSchema

		if (!this.schemaPromise) {
			this.schemaPromise = (async () => {
				try {
					const newSchema = await this.schemaVersionBuilder.buildSchema(db, prevSchema)
					this.prevSchema = newSchema
					return newSchema
				} finally {
					this.schemaPromise = undefined
				}
			})()
		}

		const newSchema = await this.schemaPromise

		if (prevSchema !== newSchema) {
			this.stageSchemaCache = {}
		}
		return newSchema
	}
}
