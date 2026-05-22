import { Command } from '../../commands/Command'
import { DeleteBuilder } from '@contember/database'

export class DeletePolicyCommand implements Command<{ deleted: boolean }> {
	constructor(private readonly slug: string) {}

	async execute({ db }: Command.Args): Promise<{ deleted: boolean }> {
		const result = await DeleteBuilder.create()
			.from('tenant_policy')
			.where({ slug: this.slug })
			.execute(db)
		return { deleted: result > 0 }
	}
}
