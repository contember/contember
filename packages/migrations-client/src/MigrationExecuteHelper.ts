import { MigrationToExecuteOkStatus } from './migrations'
import { ContentMigrationFactoryArgs, ResolvedMigrationContent } from './MigrationFile'
import { assertNever } from './utils/assertNever'
import { SystemClient } from './SystemClient'


export class MigrationExecutor {

	async executeMigrations({
		client,
		migrations,
		contentMigrationFactoryArgs,
		force,
		log = () => null,
	}: {
		client: SystemClient
		migrations: MigrationToExecuteOkStatus[]
		contentMigrationFactoryArgs: ContentMigrationFactoryArgs
		log: (message: string) => void
		force?: boolean
	}): Promise<void> {
		if (migrations.length === 0) {
			return
		}
		let migrationsToRun: ResolvedMigrationContent[] = []

		const executeMigrations = async () => {
			if (migrationsToRun.length === 0) {
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
			)
			migrationsToRun.forEach(it => {
				log(it.name)
			})
			migrationsToRun = []
		}

		log('Executing...')

		for (const migration of migrations) {
			const migrationContent = await migration.localMigration.getContent()
			if (migrationContent.type === 'factory') {
				await executeMigrations()
				const result = await migrationContent.factory(contentMigrationFactoryArgs)
				migrationsToRun.push(result)
				await executeMigrations()
			} else {
				migrationsToRun.push(migrationContent)
			}
		}
		await executeMigrations()
		log('Migration executed')
	}
}
