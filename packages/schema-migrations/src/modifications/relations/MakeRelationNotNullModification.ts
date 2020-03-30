import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { acceptRelationTypeVisitor } from '@contember/schema-utils'

class MakeRelationNotNullModification implements Modification<MakeRelationNotNullModification.Data> {
	constructor(private readonly data: MakeRelationNotNullModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		const columnName = acceptRelationTypeVisitor(this.schema.model, entity, this.data.fieldName, {
			visitManyHasOne: ({}, relation, {}, _) => relation.joiningColumn.columnName,
			visitOneHasMany: () => {
				throw new Error()
			},
			visitOneHasOneOwner: ({}, relation, {}, _) => relation.joiningColumn.columnName,
			visitOneHasOneInversed: () => undefined,
			visitManyHasManyOwner: ({}, {}, {}, _) => {
				throw new Error()
			},
			visitManyHasManyInversed: () => {
				throw new Error()
			},
		})
		if (columnName === undefined) {
			return
		}
		builder.alterColumn(entity.tableName, columnName, {
			notNull: true,
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.NullableRelation>(fieldName, field => ({
					...field,
					nullable: false,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return {
			message: `Make relation ${this.data.entityName}.${this.data.fieldName} not-nullable`,
			failureWarning: 'Changing to not-null may fail in runtime',
		}
	}
}

namespace MakeRelationNotNullModification {
	export const id = 'makeRelationNotNull'

	export interface Data {
		entityName: string
		fieldName: string
		// todo fillValue
	}
}

export default MakeRelationNotNullModification
