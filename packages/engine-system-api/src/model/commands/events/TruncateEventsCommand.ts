import { ConflictActionType, DeleteBuilder, InsertBuilder } from '@contember/database'
import { Command } from '../Command.js'

/**
 * Clears the whole content event log and records a single `truncate` event in its place,
 * so the truncate operation itself is auditable through the event log (consistent with
 * how create/update/delete content mutations are logged). The truncate event is linked to
 * every stage via `stage_transaction` so it shows up in each stage's event stream.
 */
export class TruncateEventsCommand implements Command<void> {
	constructor(
		private readonly identityId: string,
		private readonly stageIds: string[],
	) {}

	public async execute({ db, providers }: Command.Args): Promise<void> {
		await DeleteBuilder.create().from('event_data').execute(db)

		const transactionId = providers.uuid()

		await InsertBuilder.create()
			.into('event_data')
			.values({
				id: providers.uuid(),
				type: 'truncate',
				table_name: null,
				row_ids: null,
				values: null,
				created_at: expr => expr.raw('clock_timestamp()'),
				schema_id: expr => expr.raw('(SELECT MAX("id") FROM "schema_migration")'),
				identity_id: this.identityId,
				transaction_id: transactionId,
			})
			.execute(db)

		for (const stageId of this.stageIds) {
			await InsertBuilder.create()
				.into('stage_transaction')
				.values({
					transaction_id: transactionId,
					stage_id: stageId,
					applied_at: expr => expr.raw('clock_timestamp()'),
				})
				.onConflict(ConflictActionType.doNothing, ['transaction_id', 'stage_id'])
				.execute(db)
		}
	}
}
