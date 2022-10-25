import { EventsRepository } from './EventsRepository'
import { Client } from '@contember/database'
import { TargetHandlerResolver } from './TargetHandlerResolver'
import { Schema } from '@contember/schema'
export declare class EventDispatcher {
	private readonly eventsRepository
	private readonly invokeResolver
	constructor(eventsRepository: EventsRepository, invokeResolver: TargetHandlerResolver)
	processBatch({ db, schema }: {
		db: Client
		schema: Schema
	}): Promise<{
		succeed: number
		failed: number
	}>
}
//# sourceMappingURL=EventDispatcher.d.ts.map
