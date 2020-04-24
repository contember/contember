import { ContentEvent, EventType } from '@contember/engine-common'
import { DependencyBuilder, EventsDependencies } from '../DependencyBuilder'
import { TableReferencingResolver, TableReferencingResolverResult } from '../TableReferencingResolver'
import { Schema } from '@contember/schema'

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

		let tableReferencing: TableReferencingResolverResult | null = null

		const dependencies: EventsDependencies = {}
		const createdRows: { [id: string]: string } = {}

		for (const event of events) {
			if (event.type === EventType.create) {
				createdRows[event.rowId] = event.id
			} else if (createdRows[event.rowId]) {
				// update event reference to latest event
				createdRows[event.rowId] = event.id
			}

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
				if (createdRows[event.values[column]]) {
					dependencies[event.id] = [...(dependencies[event.id] || []), createdRows[event.values[column]]]
				}
			}
		}

		return dependencies
	}
}
