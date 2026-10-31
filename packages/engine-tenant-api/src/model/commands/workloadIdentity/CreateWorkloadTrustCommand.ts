import { InsertBuilder, Literal } from '@contember/database'
import { Command } from '../Command.js'
import { workloadTrustColumns, WorkloadTrustValues } from './WorkloadTrustValues.js'

/** `tokens_valid_after`, `created_at` and `updated_at` come from the column defaults, on the DB clock. */
export class CreateWorkloadTrustCommand implements Command<string> {
	constructor(
		private readonly slug: string,
		private readonly identityId: string,
		private readonly values: WorkloadTrustValues,
		private readonly createdBy: string | null,
	) {}

	async execute({ db, providers }: Command.Args): Promise<string> {
		const id = providers.uuid()
		await InsertBuilder.create()
			.into('workload_identity_trust')
			.values({
				id,
				slug: this.slug,
				identity_id: this.identityId,
				...workloadTrustColumns(this.values),
				disabled_at: this.values.disabled ? new Literal('now()') : null,
				created_by: this.createdBy,
			})
			.execute(db)
		return id
	}
}
