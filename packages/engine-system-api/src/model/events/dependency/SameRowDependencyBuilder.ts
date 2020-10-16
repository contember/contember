import { ContentEvent } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { Schema } from '@contember/schema'
import { getJunctionTables } from '../../helpers'
import assert from 'assert'
import { MapSet } from '../../../utils'

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
		const rows = new MapSet<string, string>()
		const dependencies: EventsDependencies = new MapSet()
		const junctionTables = new Set(getJunctionTables(schema.model).map(it => it.tableName))
		const formatRef = (id: string, table: string) => `${table}#${id}`
		for (const event of events) {
			if (junctionTables.has(event.tableName)) {
				continue
			}
			assert.equal(event.rowId.length, 1)
			const ref = formatRef(event.rowId[0], event.tableName)

			const events = rows.add(ref, event.id)
			dependencies.set(event.id, events)
		}

		return dependencies
	}
}
