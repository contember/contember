import KnexWrapper from '../../../core/knex/KnexWrapper'
import Project from '../../../config/Project'
import InsertBuilder from '../../../core/knex/InsertBuilder'
import { formatSchemaName } from '../helpers/stageHelpers'

class CreateStageCommand {
	constructor(private readonly stage: Project.Stage) {}

	public async execute(connection: KnexWrapper) {
		const initEvent = (await connection
			.selectBuilder()
			.from('event')
			.select('id')
			.where({ type: 'init' })
			.getResult())[0]

		await connection
			.insertBuilder()
			.into('stage')
			.values({
				id: this.stage.uuid,
				name: this.stage.name,
				slug: this.stage.slug,
				event_id: initEvent.id,
			})
			.onConflict(InsertBuilder.ConflictActionType.update, ['id'], {
				name: this.stage.name,
				slug: this.stage.slug,
			})
			.execute()

		await connection.raw('CREATE SCHEMA IF NOT EXISTS ??', formatSchemaName(this.stage))
	}
}

export default CreateStageCommand
