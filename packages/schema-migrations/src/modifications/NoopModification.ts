import { ModificationHandler } from './ModificationHandler'
import { MigrationBuilder } from '@contember/database-migrations'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from './utils/schemaUpdateUtils'

export class NoopModification implements ModificationHandler<{}> {
	createSql(builder: MigrationBuilder): void | Promise<void> {}

	getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => schema
	}

	transformEvents(events: ContentEvent[]): ContentEvent[] | Promise<ContentEvent[]> {
		return events
	}

	describe() {
		return { message: '[internal]' }
	}
}
