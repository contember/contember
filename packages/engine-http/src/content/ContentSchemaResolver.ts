import { DatabaseContext, SchemaVersionBuilder, VersionedSchema } from '@contember/engine-system-api'
import { Schema } from '@contember/schema'
import { filterSchemaByStage } from '@contember/schema-utils'

export class ContentSchemaResolver {
	private schemaCache: { [stage: string]: VersionedSchema } = {}

	constructor(private readonly schemaVersionBuilder: SchemaVersionBuilder) {}

	public clearCache() {
		this.schemaCache = {}
	}

	public async getSchema(db: DatabaseContext, stage: string): Promise<VersionedSchema> {
		const cachedSchema = this.schemaCache[stage]
		let newSchema = await this.schemaVersionBuilder.buildSchema(db, cachedSchema)
		if (newSchema !== cachedSchema) {
			newSchema = filterSchemaByStage(newSchema, stage)
		}
		this.schemaCache[stage] = newSchema
		return newSchema
	}
}
