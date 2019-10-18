import { Schema } from '@contember/schema'
import ModificationHandlerFactory from './modifications/ModificationHandlerFactory'
import Migration from './/Migration'

export class SchemaMigrator {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {}

	public applyDiff(schema: Schema, diff: Migration.Modification[]): Schema {
		for (const modification of diff) {
			const { modification: name, ...data } = modification
			const modificationHandler = this.modificationHandlerFactory.create(name, data, schema)
			schema = modificationHandler.getSchemaUpdater()(schema)
		}
		return schema
	}
}
