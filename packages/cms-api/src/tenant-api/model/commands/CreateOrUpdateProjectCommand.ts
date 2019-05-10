import Client from '../../../core/database/Client'
import Command from './Command'
import InsertBuilder from '../../../core/database/InsertBuilder'
import Project from '../type/Project'

class CreateOrUpdateProjectCommand implements Command<void> {
	constructor(private readonly project: Project) {}

	public async execute(db: Client): Promise<void> {
		await db
			.insertBuilder()
			.into('project')
			.values({
				id: this.project.id,
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

export default CreateOrUpdateProjectCommand
