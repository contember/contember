import { Migration, RunMigration } from './Migration'

export interface MigrationsResolverContext {
	runMigrations: RunMigration[]
	createTimeVersionPrefix: () => string
}
export interface MigrationsResolver<Args> {
	resolveMigrations(ctx: MigrationsResolverContext): Migration<Args>[]
}
