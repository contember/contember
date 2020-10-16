import { ContentEvent, EventType } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { TableReferencingResolver, TableReferencingResolverResult } from '../TableReferencingResolver'
import { Schema } from '@contember/schema'
import { getJunctionTables } from '../../helpers'
import assert from 'assert'
import { MapSet, tuple } from '../../../utils'

/**
 * Events that references a row depends on creation of such event (or its following update)
 *
 * A1 - A row creation
 * A2 - A row update
 * B1 - some update on B row
 * B2 - some update on B row that references A row
 *
 *     v----\
 * A1 A2 B1 B2
 *
 */
export class CreatedRowReferenceDependencyBuilder implements DependencyBuilder {
	constructor(private readonly tableReferencingResolver: TableReferencingResolver) {}

	async build(schema: Schema, events: ContentEvent[]): Promise<EventsDependencies> {
		if (events.length === 0) {
			return new MapSet()
		}

		const tableReferencing: TableReferencingResolverResult = this.tableReferencingResolver.getTableReferencing(
			schema.model,
		)

		const dependencies: EventsDependencies = new MapSet()
		const formatRef = (id: string, table: string) => `${table}#${id}`
		const createdRows = new Map<string, string>()
		const junctionTables = getJunctionTables(schema.model)
		const junctionTableMap = new Map(junctionTables.map(it => tuple(it.tableName, it)))

		for (const event of events) {
			const junctionTable = junctionTableMap.get(event.tableName)
			if (!junctionTable) {
				assert.equal(event.rowId.length, 1)
				const ref = formatRef(event.rowId[0], event.tableName)
				if (event.type === EventType.create) {
					createdRows.set(ref, event.id)
				} else if (createdRows.has(ref)) {
					// update event reference to latest event
					createdRows.set(ref, event.id)
				}
			}

			if (event.type !== EventType.create && event.type !== EventType.update) {
				continue
			}

			for (let column in event.values) {
				const referencedTable = tableReferencing[event.tableName][column]
				if (!referencedTable) {
					continue
				}
				const ref = formatRef(event.values[column], referencedTable)
				const createEventId = createdRows.get(ref)
				if (createEventId !== undefined) {
					dependencies.add(event.id, createEventId)
				}
			}
			if (junctionTable) {
				event.rowId.forEach((id, index) => {
					assert.ok(index === 0 || index === 1)
					const columnName =
						index === 0 ? junctionTable.joiningColumn.columnName : junctionTable.inverseJoiningColumn.columnName
					const table = tableReferencing[junctionTable.tableName][columnName]
					const ref = formatRef(id, table)
					const createdEventId = createdRows.get(ref)
					if (createdEventId) {
						dependencies.add(event.id, createdEventId)
					}
				})
			}
		}

		return dependencies
	}
}
