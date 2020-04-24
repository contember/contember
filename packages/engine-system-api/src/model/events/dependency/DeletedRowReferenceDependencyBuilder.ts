import { ContentEvent, EventType } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { TableReferencingResolver, TableReferencingResolverResult } from '../TableReferencingResolver'
import { Schema } from '@contember/schema'

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
			return {}
		}

		let tableReferencing: TableReferencingResolverResult | null = null

		const dependencies: EventsDependencies = {}
		const deletedRows: { [rowId: string]: string } = {}

		for (const event of events) {
			if (event.type === EventType.delete) {
				dependencies[event.id] = []
				deletedRows[event.rowId] = event.id
			}
		}

		for (const event of events) {
			if (event.type !== EventType.create && event.type !== EventType.update) {
				continue
			}

			for (let column in event.values) {
				if (tableReferencing === null) {
					tableReferencing = this.tableReferencingResolver.getTableReferencing(schema.model)
				}
				const referencedTable = tableReferencing[event.tableName][column]
				if (!referencedTable) {
					continue
				}
				if (deletedRows[event.values[column]]) {
					dependencies[deletedRows[event.values[column]]].push(event.id)
				}
			}
		}

		return dependencies
	}
}
