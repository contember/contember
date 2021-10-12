import { ProjectGroup } from '../type'
import { DatabaseContextFactory } from '../utils'

export class ProjectGroupProvider {
	private projectGroups = new Map<string | undefined, ProjectGroup>()

	constructor(
		private readonly databaseContextFactory: DatabaseContextFactory,
	) {
	}

	public getGroup(slug: string | undefined): ProjectGroup {
		let group = this.projectGroups.get(slug)
		if (!group) {
			group = {
				slug,
				database: this.databaseContextFactory.create(),
			}
			this.projectGroups.set(slug, group)
		}
		return group
	}
}
