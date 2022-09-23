import { DatabaseContext, SchemaVersionBuilder, VersionedSchema } from '@contember/engine-system-api'
import { filterSchemaByStage } from '@contember/schema-utils'

export class ContentSchemaResolver {
	private schemaCache: { [stage: string]: VersionedSchema } = {}
	private globalSchema: VersionedSchema | undefined

	constructor(private readonly schemaVersionBuilder: SchemaVersionBuilder) {}

	public clearCache() {
		this.schemaCache = {}
		this.globalSchema = undefined
	}

	public async getSchema(db: DatabaseContext, stage?: string): Promise<VersionedSchema> {
		const cachedSchema = this.globalSchema
		let newSchema = await this.schemaVersionBuilder.buildSchema(db, cachedSchema)
		this.globalSchema = newSchema
		if (!stage) {
			return this.globalSchema
		}
		if (cachedSchema !== this.globalSchema) {
			newSchema = filterSchemaByStage(newSchema, stage)
		}
		this.schemaCache[stage] = newSchema

		return newSchema
	}
}
