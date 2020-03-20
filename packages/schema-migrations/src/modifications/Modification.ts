import { MigrationBuilder } from 'node-pg-migrate'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from './schemaUpdateUtils'

export interface ModificationDescription {
	message: string
	isDestructive?: boolean
	failureWarning?: string
}

export interface Modification<Data> {
	createSql(builder: MigrationBuilder): void | Promise<void>

	getSchemaUpdater(): SchemaUpdater

	transformEvents(events: ContentEvent[]): ContentEvent[] | Promise<ContentEvent[]>

	describe(context: { createdEntities: string[] }): ModificationDescription
}
