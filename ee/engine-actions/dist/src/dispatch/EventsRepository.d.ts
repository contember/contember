import { Client } from '@contember/database'
import { EventRow, HandledEvent } from './types'
import { Actions } from '@contember/schema'
export declare class EventsRepository {
	fetchBatch(actions: Actions.Schema, db: Client): Promise<undefined | {
		events: EventRow[]
		target: Actions.AnyTarget
	}>
	private fetchInternal
	persistProcessed(db: Client, events: HandledEvent[]): Promise<[number, number]>
	requeue(db: Client, events: EventRow[]): Promise<void>
	private markSucceed
	private markFailed
	private markFailedOnUnknownTarget
}
//# sourceMappingURL=EventsRepository.d.ts.map
