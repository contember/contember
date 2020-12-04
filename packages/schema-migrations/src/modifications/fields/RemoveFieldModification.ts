import {
	acceptFieldVisitor,
	NamingHelper,
	PredicateDefinitionProcessor,
	tryGetColumnName,
} from '@contember/schema-utils'
import { isIt } from '../../utils/isIt'
import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent, EventType } from '@contember/engine-common'
import {
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
} from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { VERSION_ACL_PATCH } from '../ModificationVersions'

class RemoveFieldModification implements Modification<RemoveFieldModification.Data> {
	constructor(
		private readonly data: RemoveFieldModification.Data,
		private readonly schema: Schema,
		private readonly version: number,
	) {}

	public createSql(builder: MigrationBuilder): void {
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
		const entity = this.schema.model.entities[this.data.entityName]
		const field = entity.fields[this.data.fieldName]

		return updateSchema(
			updateModel(
				updateEntity(this.data.entityName, entity => {
					const { [this.data.fieldName]: removed, ...fields } = entity.fields
					return { ...entity, fields }
				}),
				isIt<Model.InverseRelation>(field, 'ownedBy')
					? updateEntity(
							field.target,
							updateField<Model.AnyOwningRelation>(field.ownedBy, ({ inversedBy, ...field }) => field),
					  )
					: undefined,
			),
			this.version >= VERSION_ACL_PATCH
				? updateAcl(
						updateAclEveryRole(
							updateAclEveryEntity(
								updateAclFieldPermissions((permissions, entityName) => {
									if (entityName !== this.data.entityName) {
										return permissions
									}
									const { [this.data.fieldName]: field, ...other } = permissions
									return {
										...other,
									}
								}),
								updateAclEveryPredicate((predicate, entityName) => {
									const processor = new PredicateDefinitionProcessor(this.schema.model)
									return processor.process(this.schema.model.entities[entityName], predicate, {
										handleColumn: ctx =>
											ctx.entity.name === entity.name && ctx.column.name === field.name ? undefined : ctx.value,
										handleRelation: ctx =>
											ctx.entity.name === entity.name && ctx.relation.name === field.name ? undefined : ctx.value,
									})
								}),
							),
						),
				  )
				: undefined,
		)
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
}

namespace RemoveFieldModification {
	export const id = 'removeField'

	export interface Data {
		entityName: string
		fieldName: string
	}
}

export default RemoveFieldModification
