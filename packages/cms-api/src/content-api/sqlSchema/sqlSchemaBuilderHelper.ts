import { Model } from 'cms-common'
import diffSchemas from '../../content-schema/differ/diffSchemas'
import SqlMigrator from './SqlMigrator'
import SchemaBuilder from '../../content-schema/builder/SchemaBuilder'

export function createMigrationBuilder() {
	const builderClass = require('node-pg-migrate/dist/migration-builder')
	return new builderClass(
		{},
		{
			query: null,
			select: null
		}
	)
}

const getSql = (schema: Model.Schema): string => {
	const emptySchema = new SchemaBuilder().buildSchema()
	const diff = diffSchemas(emptySchema, schema)
	return SqlMigrator.applyDiff(emptySchema, diff)
}

export default getSql
