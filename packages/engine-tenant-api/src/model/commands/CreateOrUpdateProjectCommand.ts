import { InsertBuilder } from '@contember/database'
import { Command } from './'
import { Project } from '../'

class CreateOrUpdateProjectCommand implements Command<void> {
	constructor(private readonly project: Pick<Project, 'name' | 'slug'>) {}

	public async execute({ db, providers }: Command.Args): Promise<void> {
		await db
			.insertBuilder()
			.into('project')
			.values({
				id: providers.uuid(),
				name: this.project.name,
				slug: this.project.slug,
			})
			.onConflict(InsertBuilder.ConflictActionType.update, ['slug'], {
				name: this.project.name,
				slug: this.project.slug,
			})
			.execute()
	}
}

export { CreateOrUpdateProjectCommand }
