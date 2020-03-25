import { AnyEvent, ContentEvent, EventType } from '@contember/engine-common'
import DependencyBuilder from '../DependencyBuilder'
import TableReferencingResolver from '../TableReferencingResolver'
import { SchemaVersionBuilder } from '../../../SchemaVersionBuilder'

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
class DeletedRowReferenceDependencyBuilder implements DependencyBuilder {
	constructor(
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
		private readonly tableReferencingResolver: TableReferencingResolver,
	) {}

	async build(events: ContentEvent[]): Promise<DependencyBuilder.Dependencies> {
		if (events.length === 0) {
			return {}
		}

		let [schema, schemaVersion] = await this.schemaVersionBuilder.buildSchemaForEvent(events[0].id)
		let tableReferencing: TableReferencingResolver.Result | null = null

		const dependencies: DependencyBuilder.Dependencies = {}
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

export default DeletedRowReferenceDependencyBuilder
