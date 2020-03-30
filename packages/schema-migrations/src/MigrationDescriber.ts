import ModificationHandlerFactory from './modifications/ModificationHandlerFactory'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Migration } from './Migration'
import { Schema } from '@contember/schema'
import { ModificationDescription } from './modifications/Modification'
import CreateEntityModification from './modifications/entities/CreateEntityModification'

interface ModificationDescriptionResult {
	modification: Migration.Modification
	sql: string
	schema: Schema
	description: ModificationDescription
}

export class MigrationDescriber {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {}

	public async describeModifications(schema: Schema, migration: Migration): Promise<ModificationDescriptionResult[]> {
		const result = []
		const createdEntities = []
		for (const modification of migration.modifications) {
			if (modification.modification === CreateEntityModification.id) {
				createdEntities.push(modification.entity.name)
			}
			const builder = createMigrationBuilder()
			const modificationHandler = this.modificationHandlerFactory.create(
				modification.modification,
				modification,
				schema,
				migration.formatVersion,
			)
			schema = modificationHandler.getSchemaUpdater()(schema)
			await modificationHandler.createSql(builder)
			result.push({
				modification,
				schema,
				sql: builder.getSql(),
				description: modificationHandler.describe({ createdEntities }),
			})
		}
		return result
	}
}
