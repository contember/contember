import { Schema } from '@contember/schema'
import { Migration, MigrationDescriber, MigrationVersionHelper, SchemaMigrator, SchemaUpdateError } from '@contember/schema-migrations'
import { validateSchemaAndPrintErrors } from '../../utils/schema'
import { SchemaValidatorSkippedErrors } from '@contember/schema-utils'

export const validateMigrations = async (
	initialSchema: Schema,
	migrations: Migration[],
	describer: MigrationDescriber,
	migrator: SchemaMigrator,
): Promise<boolean> => {
	let migratedSchema = initialSchema
	let projectValid = true
	let skippedErrors: SchemaValidatorSkippedErrors[] = []
	for (const migration of await migrations) {
		try {
			// just a check that it does not fail
			describer.describeModifications(migratedSchema, migration)

			migratedSchema = migrator.applyModifications(migratedSchema, migration.modifications, migration.formatVersion)
		} catch (e) {
			if (e instanceof SchemaUpdateError) {
				console.error(`Migration ${migration.name} has failed`)
			}
			throw e
		}
		const errorMessage = `Migration ${migration.name} produces invalid schema:`
		skippedErrors = [
			...skippedErrors.filter(it => it.skipUntil && MigrationVersionHelper.extractVersion(it.skipUntil) >= migration.version),
			...migration.skippedErrors ?? [],
		]
		projectValid = validateSchemaAndPrintErrors(migratedSchema, errorMessage, skippedErrors)
			&& projectValid
	}
	return projectValid
}
