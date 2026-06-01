import { Migration, RunMigration } from './Migration.js'

export interface MigrationsResolverContext {
	runMigrations: RunMigration[]
}
export interface MigrationsResolver<Args> {
	resolveMigrations(ctx: MigrationsResolverContext): Migration<Args>[]
}
