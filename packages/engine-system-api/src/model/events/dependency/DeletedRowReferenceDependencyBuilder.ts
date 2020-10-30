import { ContentEvent, EventType } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { getTableReferencing, TableReferencingResolverResult } from '../TableReferencingResolver'
import { Schema } from '@contember/schema'
import { getJunctionTables } from '../../helpers'
import assert from 'assert'
import { MapSet, tuple } from '../../../utils'

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
	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		if (events.length === 0) {
			return new MapSet()
		}

		const tableReferencing: TableReferencingResolverResult = getTableReferencing(schema.model)
		const formatRef = (id: string, table: string) => `${table}#${id}`
		const dependencies: EventsDependencies = new MapSet()
		const deletedRows = new Map()
		const junctionTables = getJunctionTables(schema.model)
		const junctionTableMap = new Map(junctionTables.map(it => tuple(it.tableName, it)))

		for (const event of events) {
			if (!junctionTableMap.has(event.tableName)) {
				assert.strictEqual(event.rowId.length, 1)
				if (event.type === EventType.delete) {
					deletedRows.set(formatRef(event.rowId[0], event.tableName), event.id)
				}
			}
		}

		for (const event of events) {
			if (event.type !== EventType.create && event.type !== EventType.update) {
				continue
			}
			const junctionTable = junctionTableMap.get(event.tableName)
			if (junctionTable) {
				event.rowId.forEach((id, index) => {
					assert.ok(index === 0 || index === 1)
					const columnName =
						index === 0 ? junctionTable.joiningColumn.columnName : junctionTable.inverseJoiningColumn.columnName
					const table = tableReferencing[junctionTable.tableName][columnName]
					const ref = formatRef(id, table)
					const deleteEventId = deletedRows.get(ref)
					if (deleteEventId) {
						dependencies.add(deleteEventId, event.id)
					}
				})
			} else {
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
		}

		return dependencies
	}
}
