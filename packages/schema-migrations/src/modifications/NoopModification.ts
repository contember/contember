import { ModificationHandler } from './ModificationHandler'
import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'

export class NoopModification implements ModificationHandler<{}> {
	createSql(builder: MigrationBuilder): void | Promise<void> {}

	getSchemaUpdater(): (value: Schema) => Schema {
		return schema => schema
	}

	transformEvents(events: ContentEvent[]): ContentEvent[] | Promise<ContentEvent[]> {
		return events
	}

	describe() {
		return { message: '[internal]' }
	}
}
