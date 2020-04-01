import { DatabaseContext, SchemaVersionBuilder, VersionedSchema } from '@contember/engine-system-api'
import { Schema } from '@contember/schema'

export class ContentSchemaResolver {
	private schemaCache: { [stage: string]: VersionedSchema } = {}

	constructor(private readonly schemaVersionBuilder: SchemaVersionBuilder, private readonly db: DatabaseContext) {}

	public async getSchema(stage: string): Promise<Schema> {
		return this.schemaVersionBuilder.buildSchemaForStage(this.db, stage, this.schemaCache[stage])
	}
}
