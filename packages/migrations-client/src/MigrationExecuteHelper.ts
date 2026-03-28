import { MigrationToExecuteOkStatus } from './migrations'
import { ContentMigrationFactoryArgs, ResolvedMigrationContent } from './MigrationFile'
import { assertNever } from './utils/assertNever'
import { SystemClient } from './SystemClient'
import { SchemaState } from './SchemaStateManager'

export class MigrationExecutor {
	async executeMigrations({
		client,
		migrations,
		contentMigrationFactoryArgs,
		force,
		schemaState,
		log = () => null,
	}: {
		client: SystemClient
		migrations: MigrationToExecuteOkStatus[]
		contentMigrationFactoryArgs: Omit<ContentMigrationFactoryArgs, 'migration'>
		log: (message: string) => void
		force?: boolean
		schemaState?: SchemaState
	}): Promise<void> {
		if (migrations.length === 0 && !schemaState) {
			return
		}
		let migrationsToRun: ResolvedMigrationContent[] = []
		let batchSchemaState: SchemaState | undefined = undefined

		const executeMigrations = async () => {
			if (migrationsToRun.length === 0 && !batchSchemaState) {
				return
			}
			await client.migrate(
				migrationsToRun.map(it => {
					if (it.type === 'schema') {
						return {
							version: it.version,
							name: it.name,
							type: 'SCHEMA',
							schemaMigration: {
								formatVersion: it.formatVersion,
								modifications: it.modifications,
								skippedErrors: it.skippedErrors,
							},
						}
					}
					if (it.type === 'content') {
						return {
							version: it.version,
							name: it.name,
							type: 'CONTENT',
							contentMigration: it.queries,
						}
					}
					return assertNever(it)
				}),
				force,
				batchSchemaState,
			)
			migrationsToRun.forEach(it => {
				log(it.name)
			})
			migrationsToRun = []
			batchSchemaState = undefined
		}

		if (migrations.length > 0) {
			log('Executing...')
		}

		for (const migration of migrations) {
			const migrationContent = await migration.localMigration.getContent()
			if (migrationContent.type === 'factory') {
				await executeMigrations()
				const result = await migrationContent.factory({
					...contentMigrationFactoryArgs,
					migration: migration.localMigration,
				})
				migrationsToRun.push(result)
				await executeMigrations()
			} else {
				migrationsToRun.push(migrationContent)
			}
		}
		batchSchemaState = schemaState
		await executeMigrations()
		if (migrations.length > 0) {
			log('Migration executed')
		}
	}
}
