import { ProjectSchemaResolver } from '@contember/engine-tenant-api'
import { SchemaVersionBuilder } from '@contember/engine-system-api'
import { normalizeSchema, ProjectContainerResolver } from '@contember/engine-http'

export const projectSchemaResolver = (
	projectContainerResolver: ProjectContainerResolver,
	schemaVersionBuilder: SchemaVersionBuilder,
): ProjectSchemaResolver => async slug => {
	const container = await projectContainerResolver(slug)
	if (!container) {
		return undefined
	}
	const db = container.systemDatabaseContextFactory.create(undefined)
	const schema = await schemaVersionBuilder.buildSchema(db)
	return normalizeSchema(schema)
}
