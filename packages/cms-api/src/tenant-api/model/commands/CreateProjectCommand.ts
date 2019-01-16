import KnexWrapper from '../../../core/knex/KnexWrapper'
import Command from './Command'
import Project from '../../../config/Project'
import InsertBuilder from '../../../core/knex/InsertBuilder'

class CreateProjectCommand implements Command<void> {
	constructor(private readonly project: Project) {}

	public async execute(db: KnexWrapper): Promise<void> {
		await db
			.insertBuilder()
			.into('project')
			.values({
				id: this.project.uuid,
				name: this.project.name,
				slug: this.project.slug,
			})
			.onConflict(InsertBuilder.ConflictActionType.update, ['id'], {
				name: this.project.name,
				slug: this.project.slug,
			})
	}
}

export default CreateProjectCommand
