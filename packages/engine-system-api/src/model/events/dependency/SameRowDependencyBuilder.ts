import { ContentEvent } from '@contember/engine-common'
import DependencyBuilder from '../DependencyBuilder'

/**
 * Events on a same row are depending on each other. Meaning that
 * a) all previous events has to be executed
 * b) all following events has to be executed (todo rethink)
 *
 *  v-----v-----v
 * A1 B1 A2 B2 A3
 *    ^-----^
 */
class SameRowDependencyBuilder implements DependencyBuilder {
	async build(events: ContentEvent[]): Promise<DependencyBuilder.Dependencies> {
		const rows: { [id: string]: string[] } = {}
		const dependencies: DependencyBuilder.Dependencies = {}
		for (const event of events) {
			if (!rows[event.rowId]) {
				rows[event.rowId] = []
			}

			// currently there is cyclic dependency on both previous and following events
			dependencies[event.id] = rows[event.rowId]

			// depending only on past events
			// dependencies[event.id] = [...rows[event.tableName][event.rowId]]

			rows[event.rowId].push(event.id)
		}

		return dependencies
	}
}

export default SameRowDependencyBuilder
