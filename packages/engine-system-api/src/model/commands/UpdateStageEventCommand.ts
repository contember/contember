import { UpdateBuilder } from '@contember/database'
import { Command } from './Command'

export class UpdateStageEventCommand implements Command<void> {
	constructor(private readonly stageSlug: string, private readonly eventId: string) {}

	public async execute({ db }: Command.Args) {
		await UpdateBuilder.create()
			.table('stage')
			.where({ slug: this.stageSlug })
			.values({
				event_id: this.eventId,
			})
			.execute(db)
	}
}
