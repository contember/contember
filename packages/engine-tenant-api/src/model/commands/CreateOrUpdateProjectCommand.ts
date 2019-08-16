import { Client, InsertBuilder } from '@contember/database'
import { Command } from './'
import { Project } from '../'
import { uuid } from '../..'

class CreateOrUpdateProjectCommand implements Command<void> {
	constructor(private readonly project: Pick<Project, 'name' | 'slug'>) {}

	public async execute(db: Client): Promise<void> {
		await db
			.insertBuilder()
			.into('project')
			.values({
				id: uuid(),
				name: this.project.name,
				slug: this.project.slug,
			})
			.onConflict(InsertBuilder.ConflictActionType.update, ['id'], {
				name: this.project.name,
				slug: this.project.slug,
			})
			.execute()
	}
}

export { CreateOrUpdateProjectCommand }
