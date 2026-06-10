import { Command } from '../../commands/Command.js'
import { InsertBuilder } from '@contember/database'
import { Policy } from '@contember/policy'

export interface CreatePolicyInput {
	slug: string
	label?: string
	description?: string
	document: Policy
}

export class CreatePolicyCommand implements Command<{ id: string }> {
	constructor(private readonly input: CreatePolicyInput) {}

	async execute({ db, providers }: Command.Args): Promise<{ id: string }> {
		const id = providers.uuid()
		await InsertBuilder.create()
			.into('tenant_policy')
			.values({
				id,
				slug: this.input.slug,
				label: this.input.label ?? this.input.slug,
				description: this.input.description ?? null,
				document: this.input.document as unknown as object,
			})
			.execute(db)
		return { id }
	}
}
