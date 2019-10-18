import { acceptFieldVisitor, NamingHelper } from '@contember/schema-utils'
import { isIt } from '@contember/utils'
import { MigrationBuilder } from 'node-pg-migrate'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { EventType } from '@contember/engine-common'

class RemoveFieldModification implements Modification<RemoveFieldModification.Data> {
	constructor(private readonly data: RemoveFieldModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		acceptFieldVisitor(this.schema.model, this.data.entityName, this.data.fieldName, {
			visitColumn: (entity, column) => {
				builder.dropColumn(entity.tableName, column.columnName)
			},
			visitManyHasOne: (entity, relation, {}, _) => {
				builder.dropColumn(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwner: (entity, relation, {}, _) => {
				builder.dropConstraint(entity.tableName, NamingHelper.createUniqueConstraintName(entity.name, [relation.name]))
				builder.dropColumn(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasOneInversed: () => {},
			visitManyHasManyOwner: ({}, relation, {}, _) => {
				builder.dropTable(relation.joiningTable.tableName)
			},
			visitManyHasManyInversed: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		const entity = this.schema.model.entities[this.data.entityName]
		const field = entity.fields[this.data.fieldName]

		return updateModel(
			updateEntity(this.data.entityName, entity => {
				const { [this.data.fieldName]: removed, ...fields } = entity.fields
				return { ...entity, fields }
			}),
			isIt<Model.InversedRelation>(field, 'ownedBy')
				? updateEntity(
						field.target,
						updateField<Model.AnyOwningRelation>(field.ownedBy, ({ inversedBy, ...field }) => field),
				  )
				: undefined,
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]
		const tableName = entity.tableName
		const columnName = (entity.fields[this.data.fieldName] as Model.AnyColumn).columnName
		return events.map(it => {
			if (
				it.tableName !== tableName ||
				(it.type !== EventType.create && it.type !== EventType.update) ||
				!it.values.hasOwnProperty(columnName)
			) {
				return it
			}

			const { [columnName]: value, ...values } = it.values
			return { ...it, values }
		})
	}
}

namespace RemoveFieldModification {
	export const id = 'removeField'

	export interface Data {
		entityName: string
		fieldName: string
	}
}

export default RemoveFieldModification
