import { DeleteBuilder } from '@contember/database'
import { Command } from '../Command.js'

export class TruncateStagesCommand implements Command<number> {
	public async execute({ db }: Command.Args): Promise<number> {
		return await DeleteBuilder.create().from('stage').execute(db)
	}
}
