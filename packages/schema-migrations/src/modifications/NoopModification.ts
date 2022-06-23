import { ModificationHandler } from './ModificationHandler.js'
import { MigrationBuilder } from '@contember/database-migrations'
import { SchemaUpdater } from './utils/schemaUpdateUtils.js'

export class NoopModification implements ModificationHandler<{}> {
	createSql(builder: MigrationBuilder): void | Promise<void> {}

	getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => schema
	}

	describe() {
		return { message: '[internal]' }
	}
}
