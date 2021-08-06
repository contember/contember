import {
	acceptFieldVisitor,
	isInverseRelation,
	isOwningRelation,
	isRelation,
	NamingHelper,
	PredicateDefinitionProcessor,
	tryGetColumnName,
} from '@contember/schema-utils'
import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent, EventType } from '@contember/engine-common'
import {
	removeField,
	SchemaUpdater,
	updateAcl,
	updateAclEveryEntity,
	updateAclEveryPredicate,
	updateAclEveryRole,
	updateAclFieldPermissions,
	updateEntity,
	updateField,
	updateModel,
	updateSchema,
} from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { VERSION_ACL_PATCH, VERSION_REMOVE_RELATION_INVERSE_SIDE } from '../ModificationVersions'
import { isDefined } from '../../utils/isDefined'

export const RemoveFieldModification: ModificationHandlerStatic<RemoveFieldModificationData> = class {
	static id = 'removeField'
	constructor(
		private readonly data: RemoveFieldModificationData,
		private readonly schema: Schema,
		private readonly formatVersion: number,
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
		return removeField(this.data.entityName, this.data.fieldName, this.formatVersion)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		const entity = this.schema.model.entities[this.data.entityName]
		const tableName = entity.tableName
		const columnName = tryGetColumnName(this.schema.model, entity, this.data.fieldName)
		if (!columnName) {
			return events
		}
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

	describe() {
		return { message: `Remove field ${this.data.entityName}.${this.data.fieldName}`, isDestructive: true }
	}

	static createModification(data: RemoveFieldModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
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
						return RemoveFieldModification.createModification({
							entityName: entity.name,
							fieldName: field.name,
						})
					})
					.filter(isDefined)
			})
	}
}

export interface RemoveFieldModificationData {
	entityName: string
	fieldName: string
}
