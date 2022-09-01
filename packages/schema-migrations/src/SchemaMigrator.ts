import { Schema } from '@contember/schema'
import { ModificationHandlerFactory } from './modifications'
import { Migration } from './Migration'

export class SchemaMigrator {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {}

	public applyModifications(schema: Schema, diff: readonly Migration.Modification[], formatVersion: number): Schema {
		for (const modification of diff) {
			const { modification: name, ...data } = modification
			const modificationHandler = this.modificationHandlerFactory.create(name, data, schema, {
				formatVersion,
				systemSchema: 'system', // not important here
			})
			schema = modificationHandler.getSchemaUpdater()({ schema })
		}
		return schema
	}
}
