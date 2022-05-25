import {
	createEntityModification,
	emptyModificationDescriptionContext,
	ModificationDescription,
	ModificationDescriptionContext,
	ModificationHandler,
	ModificationHandlerFactory,
	ModificationHandlerOptions,
	SchemaUpdateError,
} from './modifications'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Migration } from './Migration'
import { Schema } from '@contember/schema'

export interface ModificationDescriptionResult {
	modification: Migration.Modification
	sql: string
	schema: Schema
	description: ModificationDescription
	handler: ModificationHandler<any>
}

export class MigrationDescriber {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {
	}

	public async describeModification(
		schema: Schema,
		modification: Migration.Modification,
		options: ModificationHandlerOptions,
		modificationDescriptionContext: ModificationDescriptionContext = emptyModificationDescriptionContext,
	): Promise<ModificationDescriptionResult> {
		const builder = createMigrationBuilder()
		const modificationHandler = this.modificationHandlerFactory.create(
			modification.modification,
			modification,
			schema,
			options,
		)
		try {
			schema = modificationHandler.getSchemaUpdater()({ schema })
		} catch (e) {
			if (!(e instanceof SchemaUpdateError)) {
				throw e
			}
			throw new SchemaUpdateError(e.message + '\n for modification: \n' + JSON.stringify(modification))
		}
		await modificationHandler.createSql(builder)
		return {
			modification,
			schema,
			sql: builder.getSql(),
			description: modificationHandler.describe(modificationDescriptionContext),
			handler: modificationHandler,
		}
	}

	public async describeModifications(schema: Schema, migration: Migration, systemSchema: string): Promise<ModificationDescriptionResult[]> {
		const result = []
		const createdEntities = []
		for (const modification of migration.modifications) {
			if (modification.modification === createEntityModification.id) {
				createdEntities.push(modification.entity.name)
			}
			const description = await this.describeModification(
				schema,
				modification,
				{
					formatVersion: migration.formatVersion,
					systemSchema,
				},
				{
					createdEntities,
				})
			schema = description.schema
			result.push(description)
		}
		return result
	}
}
