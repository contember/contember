import { ProjectConfig } from '../../types'
import { calculateMigrationChecksum, Migration } from '@contember/schema-migrations'
import { ExecutedMigrationsResolver } from './ExecutedMigrationsResolver'
import { ExecutedMigration } from '../dtos'
import { DatabaseContext } from '../database'
import { MigrationsResolverFactory } from './MigrationsResolverFactory'

class ProjectMigrationInfoResolver {
	constructor(
		private readonly executedMigrationsResolver: ExecutedMigrationsResolver,
		public readonly migrationsResolverFactory: MigrationsResolverFactory,
	) {}

	public async getMigrationsInfo(
		db: DatabaseContext,
		project: ProjectConfig,
	): Promise<ProjectMigrationInfoResolver.Result> {
		const migrationsResolver = this.migrationsResolverFactory(project)
		const allMigrations = await migrationsResolver.getMigrations()
		const executedMigrations = await this.executedMigrationsResolver.getMigrations(db)
		const latestMigration = executedMigrations.reduce<string | null>(
			(latest, migration) => (!latest || migration.version > latest ? migration.version : latest),
			null,
		)
		const executedMigrationsMap = executedMigrations.reduce<Record<string, Migration>>(
			(acc, migr) => ({ ...acc, [migr.version]: migr }),
			{},
		)
		const allMigrationsMap = allMigrations.reduce<Record<string, Migration>>(
			(acc, migr) => ({ ...acc, [migr.version]: migr }),
			{},
		)

		const migrationsToExecute: Migration[] = []
		const badMigrations: BadMigration[] = []
		for (const migration of allMigrations) {
			const shouldExecute = !latestMigration || latestMigration < migration.version
			const isExecuted = !!executedMigrationsMap[migration.version]
			if (!shouldExecute && !isExecuted) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const migrationName = executedMigrationsMap[latestMigration!].name
				badMigrations.push({
					...migration,
					error: `New migration ${migration.name} must follow latest executed migration ${migrationName}`,
				})
			}
			if (shouldExecute) {
				migrationsToExecute.push(migration)
			}
		}
		for (const migration of executedMigrations) {
			const migrationSource = allMigrationsMap[migration.version]
			if (!migrationSource) {
				badMigrations.push({ ...migration, error: `Previously executed migration ${migration.name} is missing.` })
			} else if (calculateMigrationChecksum(migrationSource) !== migration.checksum) {
				badMigrations.push({ ...migration, error: `Previously executed migration ${migration.name} has been changed.` })
			}
		}

		return {
			migrationsDirectory: migrationsResolver.directory,
			migrationsToExecute,
			allMigrations,
			currentVersion: latestMigration,
			executedMigrations,
			badMigrations,
		}
	}
}

type BadMigration = Migration & { error: string }
namespace ProjectMigrationInfoResolver {
	export interface Result {
		migrationsDirectory: string
		currentVersion: string | null
		migrationsToExecute: Migration[]
		allMigrations: Migration[]
		executedMigrations: ExecutedMigration[]
		badMigrations: BadMigration[]
	}
}

export { ProjectMigrationInfoResolver }
