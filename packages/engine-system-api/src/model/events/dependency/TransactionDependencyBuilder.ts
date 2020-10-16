import { ContentEvent } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { Schema } from '@contember/schema'
import { MapSet } from '../../../utils'

/**
 * Events in transaction are dependent on each other (meaning you have to execute whole transaction at once)
 * todo this has to be optimized that only "dangerous" operations are dependent
 *
 * v--v   v--v--v
 * A1 A2 B1 B2 B3
 *
 */
export class TransactionDependencyBuilder implements DependencyBuilder {
	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		let trxId = null
		let eventsInTrx: Set<string> = new Set()
		let dependencies: EventsDependencies = new MapSet()

		for (const event of events) {
			if (trxId !== event.transactionId) {
				trxId = event.transactionId
				eventsInTrx = new Set()
			}
			eventsInTrx.add(event.id)
			dependencies.set(event.id, eventsInTrx)
		}

		return dependencies
	}
}
