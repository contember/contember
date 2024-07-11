import { Migration } from '@contember/migrations-client'
import { Schema } from '@contember/schema'
import { SchemaValidatorSkippedErrors } from '@contember/schema-utils'
import { MigrationDescriber, MigrationVersionHelper, SchemaMigrator, SchemaUpdateError } from '@contember/schema-migrations'
import { validateSchemaAndPrintErrors } from '../schema/SchemaValidationHelper'

export class MigrationsValidator {
	constructor(
		private readonly describer: MigrationDescriber,
		private readonly migrator: SchemaMigrator,
	) {
	}

	validate = (initialSchema: Schema, migrations: Migration[]): boolean => {
		let migratedSchema = initialSchema
		let projectValid = true
		let skippedErrors: SchemaValidatorSkippedErrors[] = []
		for (const migration of migrations) {
			try {
				// just a check that it does not fail
				this.describer.describeModifications(migratedSchema, migration)

				migratedSchema = this.migrator.applyModifications(migratedSchema, migration.modifications, migration.formatVersion)
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
}
