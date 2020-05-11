import { ContentEvent, EventType } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { TableReferencingResolver, TableReferencingResolverResult } from '../TableReferencingResolver'
import { Schema } from '@contember/schema'
import { getJunctionTables } from '../../helpers/modelHelpers'
import assert from 'assert'

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
			return {}
		}

		const tableReferencing: TableReferencingResolverResult = this.tableReferencingResolver.getTableReferencing(
			schema.model,
		)

		const dependencies: EventsDependencies = {}
		const createdRows: { [id: string]: string } = {}
		const junctionTables = getJunctionTables(schema.model)
		const junctionTableNames = new Set(junctionTables.map(it => it.tableName))

		for (const event of events) {
			const isJunction = junctionTableNames.has(event.tableName)
			if (!isJunction) {
				assert.equal(event.rowId.length, 1)
				if (event.type === EventType.create) {
					createdRows[event.rowId[0]] = event.id
				} else if (createdRows[event.rowId[0]]) {
					// update event reference to latest event
					createdRows[event.rowId[0]] = event.id
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
				if (createdRows[event.values[column]]) {
					dependencies[event.id] = [...(dependencies[event.id] || []), createdRows[event.values[column]]]
				}
			}
			if (isJunction) {
				event.rowId.forEach(id => {
					if (createdRows[id]) {
						dependencies[event.id] = [...(dependencies[event.id] || []), createdRows[id]]
					}
				})
			}
		}

		return dependencies
	}
}
