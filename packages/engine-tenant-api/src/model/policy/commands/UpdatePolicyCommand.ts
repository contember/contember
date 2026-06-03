import { Command } from '../../commands/Command.js'
import { UpdateBuilder } from '@contember/database'
import { Policy } from '@contember/policy'

export interface UpdatePolicyInput {
	slug: string
	label?: string
	description?: string | null
	document?: Policy
}

export class UpdatePolicyCommand implements Command<{ updated: boolean }> {
	constructor(private readonly input: UpdatePolicyInput) {}

	async execute({ db, providers }: Command.Args): Promise<{ updated: boolean }> {
		const values: Record<string, unknown> = { updated_at: providers.now() }
		if (this.input.label !== undefined) values.label = this.input.label
		if (this.input.description !== undefined) values.description = this.input.description
		if (this.input.document !== undefined) {
			values.document = this.input.document as unknown
		}
		const result = await UpdateBuilder.create()
			.table('tenant_policy')
			.values({
				...values as Record<string, never>,
				// bump version on every update
				version: expr => expr.raw('version + 1'),
			})
			.where({ slug: this.input.slug })
			.execute(db)
		return { updated: result > 0 }
	}
}
