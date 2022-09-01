import { MigrationBuilder } from '@contember/database-migrations'
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

	describe(context: ModificationDescriptionContext): ModificationDescription
}

export interface ModificationHandlerOptions {
	formatVersion: number
	systemSchema: string
}

export interface ModificationHandlerConstructor<Data> {
	new(data: Data, schema: Schema, options: ModificationHandlerOptions): ModificationHandler<Data>
}

export interface Differ {
	createDiff: (originalSchema: Schema, updatedSchema: Schema) => Migration.Modification[]
}


export interface ModificationType<Id extends String, Data> {
	id: Id
	createModification: (data: Data) => Migration.Modification<Data>
	createHandler: (data: Data, schema: Schema, options: ModificationHandlerOptions) => ModificationHandler<Data>
}

export const createModificationType = <Data, Id extends string>({ handler, id }: {
	id: Id
	handler: ModificationHandlerConstructor<Data>
}): ModificationType<Id, Data> => {
	return {
		id,
		createModification: data => ({ modification: id, ...data }),
		createHandler: (data, schema, options) => new handler(data, schema, options),
	}
}
