import { InsertBuilder } from '@contember/database'
import { Command } from './Command'
import { Project } from '../type'
import { ConflictActionType } from '@contember/database'

export class CreateProjectCommand implements Command<string | null> {
	constructor(private readonly project: Pick<Project, 'name' | 'slug' | 'config'>) {}

	public async execute({ db, providers }: Command.Args): Promise<string | null> {
		const id = providers.uuid()
		const result = await InsertBuilder.create()
			.into('project')
			.values({
				id: id,
				name: this.project.name,
				slug: this.project.slug,
				config: this.project.config as any,
			})
			.onConflict(ConflictActionType.doNothing)
			.execute(db)
		return result > 0 ? id : null
	}
}
