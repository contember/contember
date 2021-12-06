import { ModificationHandler } from './ModificationHandler'
import { MigrationBuilder } from '@contember/database-migrations'
import { SchemaUpdater } from './utils/schemaUpdateUtils'

export class NoopModification implements ModificationHandler<{}> {
	createSql(builder: MigrationBuilder): void | Promise<void> {}

	getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => schema
	}

	describe() {
		return { message: '[internal]' }
	}
}
