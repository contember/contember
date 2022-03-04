import { Schema } from '@contember/schema'
import { Migration, MigrationDescriber, SchemaMigrator, SchemaUpdateError } from '@contember/schema-migrations'
import { validateSchemaAndPrintErrors } from '../../utils/schema'

export const validateMigrations = async (
	initialSchema: Schema,
	migrations: Migration[],
	describer: MigrationDescriber,
	migrator: SchemaMigrator,
): Promise<boolean> => {
	let migratedSchema = initialSchema
	let projectValid = true
	for (const migration of await migrations) {
		try {
			// just a check that it does not fail
			await describer.describeModifications(migratedSchema, migration, 'system') // schema name not important here

			migratedSchema = migrator.applyModifications(migratedSchema, migration.modifications, migration.formatVersion)
		} catch (e) {
			if (e instanceof SchemaUpdateError) {
				console.error(`Migration ${migration.name} has failed`)
			}
			throw e
		}
		projectValid =
			validateSchemaAndPrintErrors(migratedSchema, `Migration ${migration.name} produces invalid schema:`) &&
			projectValid
	}
	return projectValid
}
