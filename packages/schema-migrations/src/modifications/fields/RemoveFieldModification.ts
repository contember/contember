import { acceptFieldVisitor, isInverseRelation, isRelation, NamingHelper } from '@contember/schema-utils'
import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { removeField, SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler, ModificationHandlerOptions } from '../ModificationHandler'
import { isDefined } from '../../utils/isDefined'

export class RemoveFieldModificationHandler implements ModificationHandler<RemoveFieldModificationData> {

	constructor(
		protected readonly data: RemoveFieldModificationData,
		protected readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		acceptFieldVisitor(this.schema.model, this.data.entityName, this.data.fieldName, {
			visitColumn: (entity, column) => {
				builder.dropColumn(entity.tableName, column.columnName)
			},
			visitManyHasOne: (entity, relation, {}, _) => {
				builder.dropColumn(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwning: (entity, relation, {}, _) => {
				builder.dropConstraint(entity.tableName, NamingHelper.createUniqueConstraintName(entity.name, [relation.name]))
				builder.dropColumn(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasOneInverse: () => {},
			visitManyHasManyOwning: ({}, relation, {}, _) => {
				builder.dropTable(relation.joiningTable.tableName)
			},
			visitManyHasManyInverse: () => {},
		})
	}

	public getSchemaUpdater(): SchemaUpdater {
		return removeField(this.data.entityName, this.data.fieldName, this.options.formatVersion)
	}

	describe() {
		return { message: `Remove field ${this.data.entityName}.${this.data.fieldName}`, isDestructive: true }
	}

}

export interface RemoveFieldModificationData {
	entityName: string
	fieldName: string
}

export const removeFieldModification = createModificationType({
	id: 'removeField',
	handler: RemoveFieldModificationHandler,
})

export class RemoveFieldDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.filter(({ name }) => originalSchema.model.entities[name])
			.flatMap(entity => {
				const originalEntity = originalSchema.model.entities[entity.name]

				return Object.values(originalEntity.fields)
					.filter(field => !entity.fields[field.name])
					.map(field => {
						if (isRelation(field) && isInverseRelation(field)) {
							const target = updatedSchema.model.entities[field.target]
							if (!target || !target.fields[field.ownedBy]) {
								return undefined
							}
						}
						return removeFieldModification.createModification({
							entityName: entity.name,
							fieldName: field.name,
						})
					})
					.filter(isDefined)
			})
	}
}
