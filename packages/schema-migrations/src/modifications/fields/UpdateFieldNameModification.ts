import { MigrationBuilder } from '@contember/database-migrations'
import { Input, Model, Schema, Value } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import {
	SchemaUpdater,
	updateAcl,
	updateAclEveryEntity,
	updateAclEveryPredicate,
	updateAclEveryRole,
	updateAclFieldPermissions,
	updateEntity,
	updateEveryEntity,
	updateEveryField,
	updateModel,
	updateSchema,
} from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { acceptFieldVisitor, NamingHelper, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { VERSION_ACL_PATCH, VERSION_UPDATE_CONSTRAINT_NAME } from '../ModificationVersions'
import { renameConstraintSchemaUpdater, renameConstraintsSqlBuilder } from '../utils/renameConstraintsHelper'
import { changeValue } from '../utils/valueUtils'

export const UpdateFieldNameModification: ModificationHandlerStatic<UpdateFieldNameModificationData> = class {
	static id = 'updateFieldName'
	constructor(
		private readonly data: UpdateFieldNameModificationData,
		private readonly schema: Schema,
		private readonly formatVersion: number,
	) {}

	public createSql(builder: MigrationBuilder): void {
		if (this.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME) {
			const entity = this.schema.model.entities[this.data.entityName]
			renameConstraintsSqlBuilder(builder, entity, this.getNewConstraintName.bind(this))
		}
	}

	public getSchemaUpdater(): SchemaUpdater {
		const updateConstraintName =
			this.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME
				? updateEntity(this.data.entityName, renameConstraintSchemaUpdater(this.getNewConstraintName.bind(this)))
				: undefined
		const updateConstraintFields =
			this.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME
				? updateEntity(this.data.entityName, entity => {
						return {
							...entity,
							unique: Object.fromEntries(
								Object.entries(entity.unique).map(([name, unique]) => [
									name,
									{
										...unique,
										fields: unique.fields.map(changeValue(this.data.fieldName, this.data.newFieldName)),
									},
								]),
							),
						}
				  })
				: undefined

		const updateRelationReferences = updateEveryEntity(
			updateEveryField((field, entity) => {
				const isUpdatedRelation = (entity: Model.Entity, relation: Model.AnyRelation | null) => {
					return entity.name === this.data.entityName && relation && relation.name === this.data.fieldName
				}

				return acceptFieldVisitor<Model.AnyField>(this.schema.model, entity, field, {
					visitColumn: (entity, field) => field,
					visitManyHasOne: (entity, relation, targetEntity, targetRelation) => {
						return isUpdatedRelation(targetEntity, targetRelation)
							? { ...relation, inversedBy: this.data.newFieldName }
							: relation
					},
					visitOneHasMany: (entity, relation, targetEntity, targetRelation) => {
						return isUpdatedRelation(targetEntity, targetRelation)
							? { ...relation, ownedBy: this.data.newFieldName }
							: relation
					},
					visitOneHasOneOwning: (entity, relation, targetEntity, targetRelation) => {
						return isUpdatedRelation(targetEntity, targetRelation)
							? { ...relation, inversedBy: this.data.newFieldName }
							: relation
					},
					visitOneHasOneInverse: (entity, relation, targetEntity, targetRelation) => {
						return isUpdatedRelation(targetEntity, targetRelation)
							? { ...relation, ownedBy: this.data.newFieldName }
							: relation
					},
					visitManyHasManyOwning: (entity, relation, targetEntity, targetRelation) => {
						return isUpdatedRelation(targetEntity, targetRelation)
							? { ...relation, inversedBy: this.data.newFieldName }
							: relation
					},
					visitManyHasManyInverse: (entity, relation, targetEntity, targetRelation) => {
						return isUpdatedRelation(targetEntity, targetRelation)
							? { ...relation, ownedBy: this.data.newFieldName }
							: relation
					},
				})
			}),
		)
		const updateEntityName = updateEntity(this.data.entityName, entity => {
			const { [this.data.fieldName]: updated, ...fields } = entity.fields
			return {
				...entity,
				fields: {
					...fields,
					[this.data.newFieldName]: { ...updated, name: this.data.newFieldName },
				},
			}
		})
		const updateAclOp =
			this.formatVersion >= VERSION_ACL_PATCH
				? updateAcl(
						updateAclEveryRole(
							updateAclEveryEntity(
								updateAclFieldPermissions((permissions, entityName) => {
									if (entityName !== this.data.entityName) {
										return permissions
									}
									if (!permissions[this.data.fieldName]) {
										return permissions
									}
									const { [this.data.fieldName]: field, ...other } = permissions
									return {
										[this.data.newFieldName]: field,
										...other,
									}
								}),
								updateAclEveryPredicate((predicate, entityName) => {
									const processor = new PredicateDefinitionProcessor(this.schema.model)
									const currentEntity = this.schema.model.entities[entityName]
									return processor.process<Input.Condition<Value.FieldValue<never>> | string, never>(
										currentEntity,
										predicate,
										{
											handleColumn: ctx =>
												ctx.entity.name === this.data.entityName && ctx.column.name === this.data.fieldName
													? [this.data.newFieldName, ctx.value]
													: ctx.value,
											handleRelation: ctx =>
												ctx.entity.name === this.data.entityName && ctx.relation.name === this.data.fieldName
													? [this.data.newFieldName, ctx.value]
													: ctx.value,
										},
									)
								}),
							),
						),
				  )
				: undefined
		return updateSchema(
			updateModel(updateConstraintName, updateConstraintFields, updateRelationReferences, updateEntityName),
			updateAclOp,
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	private getNewConstraintName(constraint: Model.UniqueConstraint): string | null {
		const generatedName = NamingHelper.createUniqueConstraintName(this.data.entityName, constraint.fields)
		const isGenerated = constraint.name === generatedName
		if (!isGenerated) {
			null
		}
		const newFieldNames = constraint.fields.map(changeValue(this.data.fieldName, this.data.newFieldName))
		const newName = NamingHelper.createUniqueConstraintName(this.data.entityName, newFieldNames)
		return newName === constraint.name ? null : newName
	}

	describe() {
		return { message: `Change field name ${this.data.entityName}.${this.data.fieldName} to ${this.data.newFieldName}` }
	}

	static createModification(data: UpdateFieldNameModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface UpdateFieldNameModificationData {
	entityName: string
	fieldName: string
	newFieldName: string
}
