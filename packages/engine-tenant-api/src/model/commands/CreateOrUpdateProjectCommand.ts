import { ConflictActionType, InsertBuilder, Operator } from '@contember/database'
import { Command } from './Command'
import { Project } from '../type'

class CreateOrUpdateProjectCommand implements Command<boolean> {
	constructor(private readonly project: Pick<Project, 'name' | 'slug'>) {}

	public async execute({ db, providers }: Command.Args): Promise<boolean> {
		const result = await InsertBuilder.create()
			.into('project')
			.values({
				id: providers.uuid(),
				name: this.project.name,
				slug: this.project.slug,
			})
			.onConflict(
				ConflictActionType.update,
				['slug'],
				{
					name: this.project.name,
				},
				expr => expr.compareColumns(['excluded', 'name'], Operator.notEq, ['project', 'name']),
			)
			.execute(db)
		return result > 0
	}
}

export { CreateOrUpdateProjectCommand }
