import { MigrationsResolver, MigrationsResolverContext } from './MigrationsResolver'
import { Migration } from './Migration'

export class GroupMigrationsResolver<Args> implements MigrationsResolver<Args> {
	constructor(
		private readonly primaryGroup: MigrationsResolver<Args>,
		private readonly groups: Record<string, MigrationsResolver<Args>>,
	) {
	}

	resolveMigrations({ runMigrations, createTimeVersionPrefix }: MigrationsResolverContext): Migration<Args>[] {
		const allMigrations: Migration<Args>[] = []
		const primaryMigrations = this.primaryGroup.resolveMigrations({
			runMigrations: runMigrations.filter(it => it.group === null),
			createTimeVersionPrefix,
		})
		allMigrations.push(...primaryMigrations)
		for (const groupName in this.groups) {
			const groupMigrations = this.groups[groupName].resolveMigrations({
				createTimeVersionPrefix,
				runMigrations: runMigrations.filter(it => it.group === groupName),
			}).map(it => new Migration(it.name, it.migration, groupName))
			allMigrations.push(...groupMigrations)
		}
		return allMigrations.sort((a, b) => a.name.localeCompare(b.name))
	}
}
