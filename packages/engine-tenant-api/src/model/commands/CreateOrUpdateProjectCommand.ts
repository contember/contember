import { ConflictActionType, InsertBuilder } from '@contember/database'
import { Command } from './Command'
import { Project } from '../type'

class CreateOrUpdateProjectCommand implements Command<void> {
	constructor(private readonly project: Pick<Project, 'name' | 'slug'>) {}

	public async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('project')
			.values({
				id: providers.uuid(),
				name: this.project.name,
				slug: this.project.slug,
			})
			.onConflict(ConflictActionType.update, ['slug'], {
				name: this.project.name,
				slug: this.project.slug,
			})
			.execute(db)
	}
}

export { CreateOrUpdateProjectCommand }
