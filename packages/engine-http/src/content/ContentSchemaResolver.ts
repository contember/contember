import { DatabaseContext, SchemaVersionBuilder, VersionedSchema } from '@contember/engine-system-api'
import { Schema } from '@contember/schema'

export class ContentSchemaResolver {
	private schemaCache: { [stage: string]: VersionedSchema } = {}

	constructor(private readonly schemaVersionBuilder: SchemaVersionBuilder) {}

	public async getSchema(db: DatabaseContext, stage: string): Promise<Schema> {
		const cachedSchema = this.schemaCache[stage]
		const newSchema = await this.schemaVersionBuilder.buildSchemaForStage(db, stage, cachedSchema)
		this.schemaCache[stage] = newSchema
		return newSchema
	}
}
