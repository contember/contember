import { AnyEvent, ContentEvent, EventType } from '@contember/engine-common'
import DependencyBuilder from '../DependencyBuilder'
import TableReferencingResolver from '../TableReferencingResolver'
import { SchemaVersionBuilder } from '../../../SchemaVersionBuilder'

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
class CreatedRowReferenceDependencyBuilder implements DependencyBuilder {
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

export default CreatedRowReferenceDependencyBuilder
