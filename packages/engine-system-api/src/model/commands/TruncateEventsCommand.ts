import { DeleteBuilder } from '@contember/database'
import { Command } from './Command'

export class TruncateEventsCommand implements Command<number> {
	public async execute({ db }: Command.Args): Promise<number> {
		return await DeleteBuilder.create().from('event').execute(db)
	}
}
