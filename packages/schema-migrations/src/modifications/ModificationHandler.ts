import { MigrationBuilder } from '@contember/database-migrations'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater } from './utils/schemaUpdateUtils'
import { Schema } from '@contember/schema'
import { Migration } from '../Migration'

export interface ModificationDescription {
	message: string
	isDestructive?: boolean
	failureWarning?: string
}

export const emptyModificationDescriptionContext: ModificationDescriptionContext = { createdEntities: [] }
export type ModificationDescriptionContext = { createdEntities: string[] }

export interface ModificationHandler<Data> {
	createSql(builder: MigrationBuilder): void | Promise<void>

	getSchemaUpdater(): SchemaUpdater

	transformEvents(events: ContentEvent[]): ContentEvent[] | Promise<ContentEvent[]>

	describe(context: ModificationDescriptionContext): ModificationDescription
}

export type CreateDiff = (originalSchema: Schema, updatedSchema: Schema) => Migration.Modification[]

export interface ModificationHandlerStatic<Data> {
	id: string
	createModification: (data: Data) => Migration.Modification<Data>
	createDiff?: CreateDiff
	new (data: Data, schema: Schema, formatVersion: number): ModificationHandler<Data>
}

export interface Differ {
	createDiff: CreateDiff
}
