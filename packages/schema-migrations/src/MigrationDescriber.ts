import {
	createEntityModification,
	emptyModificationDescriptionContext,
	ModificationDescription,
	ModificationDescriptionContext,
	ModificationHandler,
	ModificationHandlerCreateSqlOptions,
	ModificationHandlerFactory,
	ModificationHandlerOptions,
	SchemaUpdateError,
} from './modifications'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Migration } from './Migration'
import { Schema } from '@contember/schema'

export interface ModificationDescriptionResult {
	modification: Migration.Modification
	schema: Schema
	description: ModificationDescription
	handler: ModificationHandler<any>
	getSql: (options: ModificationHandlerCreateSqlOptions) => string
}

export class MigrationDescriber {
	constructor(private readonly modificationHandlerFactory: ModificationHandlerFactory) {
	}

	public describeModification(
		schema: Schema,
		modification: Migration.Modification,
		options: ModificationHandlerOptions,
		modificationDescriptionContext: ModificationDescriptionContext = emptyModificationDescriptionContext,
	): ModificationDescriptionResult {
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
		return {
			modification,
			schema,
			getSql: options => {
				const builder = createMigrationBuilder()
				modificationHandler.createSql(builder, options)
				return builder.getSql()
			},
			description: modificationHandler.describe(modificationDescriptionContext),
			handler: modificationHandler,
		}
	}

	public describeModifications(schema: Schema, migration: Migration): ModificationDescriptionResult[] {
		const result = []
		const createdEntities = []
		for (const modification of migration.modifications) {
			if (modification.modification === createEntityModification.id) {
				createdEntities.push(modification.entity.name)
			}
			const description = this.describeModification(
				schema,
				modification,
				{
					formatVersion: migration.formatVersion,
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
