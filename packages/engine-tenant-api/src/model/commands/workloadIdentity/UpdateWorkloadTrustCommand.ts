import { Literal, UpdateBuilder } from '@contember/database'
import { Command } from '../Command.js'
import { workloadTrustColumns, WorkloadTrustValues } from './WorkloadTrustValues.js'

export class UpdateWorkloadTrustCommand implements Command<void> {
	constructor(
		private readonly id: string,
		private readonly values: WorkloadTrustValues,
		private readonly bumpTokensValidAfter: boolean,
	) {}

	async execute({ db }: Command.Args): Promise<void> {
		await UpdateBuilder.create()
			.table('workload_identity_trust')
			.values({
				...workloadTrustColumns(this.values),
				// an already disabled trust keeps its original disable time
				disabled_at: this.values.disabled ? new Literal('coalesce("disabled_at", now())') : null,
				updated_at: new Literal('now()'),
				...(this.bumpTokensValidAfter ? { tokens_valid_after: new Literal('now()') } : {}),
			})
			.where({ id: this.id })
			.execute(db)
	}
}
