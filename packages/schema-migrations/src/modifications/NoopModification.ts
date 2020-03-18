import { Modification } from './Modification'
import { MigrationBuilder } from 'node-pg-migrate'
import { Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'

export class NoopModification implements Modification<{}> {
	createSql(builder: MigrationBuilder): void | Promise<void> {}

	getSchemaUpdater(): (value: Schema) => Schema {
		return schema => schema
	}

	transformEvents(events: ContentEvent[]): ContentEvent[] | Promise<ContentEvent[]> {
		return events
	}
}
