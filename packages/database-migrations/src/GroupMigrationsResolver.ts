import { MigrationsResolver, MigrationsResolverContext } from './MigrationsResolver'
import { Migration } from './Migration'
import { timePrefixLength } from './helpers'

export class GroupMigrationsResolver<Args> implements MigrationsResolver<Args> {
	constructor(
		private readonly primaryGroup: MigrationsResolver<Args>,
		private readonly groups: Record<string, MigrationsResolver<Args>>,
	) {
	}

	resolveMigrations({ runMigrations }: MigrationsResolverContext): Migration<Args>[] {
		const allMigrations: Migration<Args>[] = []
		const primaryMigrations = this.primaryGroup.resolveMigrations({
			runMigrations: runMigrations.filter(it => it.group === null),
		})
		allMigrations.push(...primaryMigrations)
		for (const groupName in this.groups) {
			const groupMigrations = this.groups[groupName].resolveMigrations({
				runMigrations: runMigrations.filter(it => it.group === groupName),
			}).map(it => new Migration(it.name, it.migration, groupName))
			allMigrations.push(...groupMigrations)
		}
		return allMigrations.sort((a, b) => {
			const compareResult = a.name.slice(0, timePrefixLength).localeCompare(b.name.slice(0, timePrefixLength))
			if (compareResult !== 0) {
				return compareResult
			}
			// if the time is same, prefer primary group
			if (a.group === null) {
				return -1
			}
			if (b.group === null) {
				return 1
			}
			return a.group.localeCompare(b.group) || a.name.localeCompare(b.name)
		})
	}
}
