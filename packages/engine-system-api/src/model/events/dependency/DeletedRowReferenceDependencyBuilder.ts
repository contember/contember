import { ContentEvent, EventType } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { TableReferencingResolver, TableReferencingResolverResult } from '../TableReferencingResolver'
import { Schema } from '@contember/schema'
import { getJunctionTables } from '../../helpers/modelHelpers'
import assert from 'assert'
import { MapSet } from '../../../utils'

/**
 * Delete event depends on all previous events which references this row
 *
 * A1 - update event which references X row
 * A2 - another event which does not reference X row
 *
 *  v----\
 * A1 A2 X1
 *
 */
export class DeletedRowReferenceDependencyBuilder implements DependencyBuilder {
	constructor(private readonly tableReferencingResolver: TableReferencingResolver) {}

	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		if (events.length === 0) {
			return new MapSet()
		}

		const tableReferencing: TableReferencingResolverResult = this.tableReferencingResolver.getTableReferencing(
			schema.model,
		)
		const formatRef = (id: string, table: string) => `${table}#${id}`
		const dependencies: EventsDependencies = new MapSet()
		const deletedRows = new Map()
		const junctionTables = new Set(getJunctionTables(schema.model).map(it => it.tableName))

		for (const event of events) {
			if (!junctionTables.has(event.tableName)) {
				assert.equal(event.rowId.length, 1)
				if (event.type === EventType.delete) {
					deletedRows.set(formatRef(event.rowId[0], event.tableName), event.id)
				}
			}
		}

		for (const event of events) {
			if (event.type !== EventType.create && event.type !== EventType.update) {
				continue
			}

			for (let column in event.values) {
				const referencedTable = tableReferencing[event.tableName][column]
				if (!referencedTable) {
					continue
				}
				const ref = formatRef(event.values[column], referencedTable)
				const deleteEventId = deletedRows.get(ref)
				if (deleteEventId) {
					dependencies.add(deleteEventId, event.id)
				}
			}
		}

		return dependencies
	}
}
