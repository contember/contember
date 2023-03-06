import { Migration, MigrationExecutor } from './Migration'
import { MigrationsResolver, MigrationsResolverContext } from './MigrationsResolver'
import { checkOrder, timePrefixLength } from './helpers'

export class SnapshotMigrationResolver<Args> implements MigrationsResolver<Args> {
	constructor(
		private snapshot: MigrationExecutor<Args>,
		private migrations: Record<string, MigrationExecutor<Args>>,
		private suffix: string = 'snapshot',
	) {
	}

	resolveMigrations(
		{ runMigrations, createTimeVersionPrefix }: MigrationsResolverContext,
	): Migration<Args>[] {
		// runMigrations = runMigrations.filter(it => it.group === group)
		if (runMigrations.length === 0 && !process.env.CONTEMBER_MIGRATIONS_NO_SNAPSHOT) {
			const timePrefix = createTimeVersionPrefix()
			return [new Migration<Args>(`${timePrefix}-${this.suffix}`, this.snapshot)]
		}

		const migrations = Object.entries(this.migrations).map(([version, executor]) => new Migration<Args>(version, executor))
		const resolvedMigrations = runMigrations.length > 0 && runMigrations[0].name.slice(timePrefixLength) === `-${this.suffix}`
			? [
				new Migration<Args>(runMigrations[0].name, this.snapshot),
				...migrations.filter(it => it.name > runMigrations[0].name),
			]
			: migrations

		checkOrder(runMigrations, resolvedMigrations)

		return resolvedMigrations
	}
}
