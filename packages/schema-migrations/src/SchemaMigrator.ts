import { Schema } from '@contember/schema'
import ModificationHandlerFactory from './modifications/ModificationHandlerFactory'
import Migration from './/Migration'
import { VERSION_INITIAL } from './modifications/ModificationVersions'

export class SchemaMigrator {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {}

	public applyModifications(schema: Schema, diff: Migration.Modification[], formatVersion: number): Schema {
		for (const modification of diff) {
			const { modification: name, ...data } = modification
			const modificationHandler = this.modificationHandlerFactory.create(name, data, schema, formatVersion)
			schema = modificationHandler.getSchemaUpdater()(schema)
		}
		return schema
	}
}
