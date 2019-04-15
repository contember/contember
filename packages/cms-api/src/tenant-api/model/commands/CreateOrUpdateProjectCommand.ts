import KnexWrapper from '../../../core/knex/KnexWrapper'
import Command from './Command'
import InsertBuilder from '../../../core/knex/InsertBuilder'
import Project from '../type/Project'

class CreateOrUpdateProjectCommand implements Command<void> {
	constructor(private readonly project: Project) {}

	public async execute(db: KnexWrapper): Promise<void> {
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
	}
}

export default CreateOrUpdateProjectCommand
