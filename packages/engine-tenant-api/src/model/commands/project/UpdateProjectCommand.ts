import { QueryBuilder, UpdateBuilder } from '@contember/database'
import { Command } from '../Command.js'
import { Project } from '../../type/index.js'

export class UpdateProjectCommand implements Command<void> {
	constructor(private projectId: string, private readonly data: Partial<Pick<Project, 'name' | 'config'>>) {}

	public async execute({ db, providers }: Command.Args): Promise<void> {
		const values: QueryBuilder.Values = {
			updated_at: 'now',
		}
		if (this.data.config !== undefined) {
			values.config = this.data.config as any
		}
		if (this.data.name !== undefined) {
			values.name = this.data.name
		}

		await UpdateBuilder.create()
			.table('project')
			.values(values)
			.where({
				id: this.projectId,
			})
			.execute(db)
	}
}
