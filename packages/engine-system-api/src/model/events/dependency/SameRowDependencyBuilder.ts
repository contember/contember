import { ContentEvent } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { Schema } from '@contember/schema'
import { getJunctionTables } from '../../helpers/modelHelpers'
import assert from 'assert'

/**
 * Events on a same row are depending on each other. Meaning that
 * a) all previous events has to be executed
 * b) all following events has to be executed (todo rethink)
 *
 *  v-----v-----v
 * A1 B1 A2 B2 A3
 *    ^-----^
 */
export class SameRowDependencyBuilder implements DependencyBuilder {
	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		const rows: { [id: string]: string[] } = {}
		const dependencies: EventsDependencies = {}
		const junctionTables = new Set(getJunctionTables(schema.model).map(it => it.tableName))
		for (const event of events) {
			if (junctionTables.has(event.tableName)) {
				continue
			}
			assert.equal(event.rowId.length, 1)

			const rowId = event.rowId[0]
			if (!rows[rowId]) {
				rows[rowId] = []
			}

			// currently there is cyclic dependency on both previous and following events
			dependencies[event.id] = rows[rowId]

			// depending only on past events
			// dependencies[event.id] = [...rows[event.tableName][rowId]]

			rows[rowId].push(event.id)
		}

		return dependencies
	}
}
