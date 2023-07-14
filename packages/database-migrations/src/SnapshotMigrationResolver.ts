import { Migration, MigrationExecutor, RunMigration } from './Migration'
import { MigrationsResolver, MigrationsResolverContext } from './MigrationsResolver'
import { checkOrder, timePrefixLength } from './helpers'

export class SnapshotMigrationResolver<Args> implements MigrationsResolver<Args> {
	constructor(
		private snapshot: MigrationExecutor<Args>,
		private migrations: Record<string, MigrationExecutor<Args>>,
		private suffix: string = 'snapshot',
		private baseMigrations?: Record<string, MigrationExecutor<Args>>,
	) {
	}

	resolveMigrations(
		{ runMigrations }: MigrationsResolverContext,
	): Migration<Args>[] {

		if (this.canUseSnapshot(runMigrations)) {
			return this.getSnapshotMigration()
		}

		const resolvedMigrations = this.getEffectiveMigrations(runMigrations)

		checkOrder(runMigrations, resolvedMigrations)

		return resolvedMigrations
	}

	private canUseSnapshot(runMigrations: RunMigration[]): boolean {
		return runMigrations.length === 0 && !process.env.CONTEMBER_MIGRATIONS_NO_SNAPSHOT
	}

	private getSnapshotMigration(): Migration<Args>[] {
		const migrations = Object.keys(this.migrations)
		const baseMigrations = Object.keys(this.baseMigrations ?? {})

		const lastMigration = migrations[migrations.length - 1]?.slice(0, timePrefixLength)
		const lastBaseMigration = baseMigrations[baseMigrations.length - 1]?.slice(0, timePrefixLength)

		const fallback = '0000-00-00-000000'
		// time prefix matches latest base or current group migration
		const timePrefix = lastMigration && lastBaseMigration
			? (lastMigration > lastBaseMigration ? lastMigration : lastBaseMigration)
			: (lastMigration ?? lastBaseMigration ?? fallback)

		return [
			new Migration<Args>(`${timePrefix}-${this.suffix}`, this.snapshot),
		]
	}

	private getEffectiveMigrations(runMigrations: RunMigration[]): Migration<Args>[] {
		const migrations = Object.entries(this.migrations).map(([version, executor]) => new Migration<Args>(version, executor))

		const wasSnapshotExecuted = runMigrations.length > 0
			&& runMigrations[0]?.name.slice(timePrefixLength) === `-${this.suffix}`

		if (!wasSnapshotExecuted) {
			return migrations
		}

		const executedSnapshotMigration = new Migration<Args>(runMigrations[0].name, this.snapshot)
		const minVersion = runMigrations[0].name.slice(0, timePrefixLength)

		return [
			executedSnapshotMigration,
			...migrations.filter(it => it.name.slice(0, timePrefixLength) > minVersion),
		]
	}
}
