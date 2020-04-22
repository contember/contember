import { AnyEvent, ContentEvent } from '@contember/engine-common'
import DependencyBuilder from '../DependencyBuilder'
import { Schema } from '@contember/schema'

/**
 * Events in transaction are dependent on each other (meaning you have to execute whole transaction at once)
 * todo this has to be optimized that only "dangerous" operations are dependent
 *
 * v--v   v--v--v
 * A1 A2 B1 B2 B3
 *
 */
class TransactionDependencyBuilder implements DependencyBuilder {
	async build(schema: Schema, events: ContentEvent[]): Promise<DependencyBuilder.Dependencies> {
		let trxId = null
		let eventsInTrx: AnyEvent[] = []
		let dependencies: DependencyBuilder.Dependencies = {}

		for (const event of events) {
			if (trxId !== event.transactionId) {
				if (eventsInTrx.length > 0) {
					dependencies = { ...dependencies, ...this.buildTransactionReferences(eventsInTrx) }
				}
				trxId = event.transactionId
				eventsInTrx = []
			}

			eventsInTrx.push(event)
		}
		if (eventsInTrx.length > 0) {
			dependencies = { ...dependencies, ...this.buildTransactionReferences(eventsInTrx) }
		}

		return dependencies
	}

	private buildTransactionReferences(events: AnyEvent[]): DependencyBuilder.Dependencies {
		const ids = events.map(it => it.id)
		return ids.reduce((result, id) => ({ ...result, [id]: ids }), {})
	}
}

export default TransactionDependencyBuilder
