import { DeleteBuilder } from '@contember/database'
import { Command } from '../Command'

export class DeleteMigrationCommand implements Command<boolean> {
	constructor(private readonly version: string) {}

	public async execute({ db }: Command.Args): Promise<boolean> {
		const result = await DeleteBuilder.create() //
			.from('schema_migration')
			.where({
				version: this.version,
			})
			.execute(db)
		return result > 0
	}
}
