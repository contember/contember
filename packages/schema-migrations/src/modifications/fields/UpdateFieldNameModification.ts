import { MigrationBuilder } from '@contember/database-migrations'
import { Input, Model, Schema, Value } from '@contember/schema'
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
} from '../utils/schemaUpdateUtils'
import { createModificationType, ModificationHandler, ModificationHandlerOptions } from '../ModificationHandler'
import { acceptFieldVisitor, NamingHelper, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { VERSION_ACL_PATCH, VERSION_UPDATE_CONSTRAINT_NAME } from '../ModificationVersions'
import { renameConstraintSchemaUpdater, renameConstraintsSqlBuilder } from '../utils/renameConstraintsHelper'
import { changeValue } from '../utils/valueUtils'
import { updateColumnNameModification } from '../columns'
import { NoopModification } from '../NoopModification'

export class UpdateFieldNameModificationHandler implements ModificationHandler<UpdateFieldNameModificationData> {
	private renameColumnSubModification: ModificationHandler<any> = new NoopModification()

	constructor(
		protected readonly data: UpdateFieldNameModificationData,
		protected readonly schema: Schema,
		private readonly options: ModificationHandlerOptions,
	) {
		if (this.data.columnName) {
			this.renameColumnSubModification = updateColumnNameModification.createHandler({
				entityName: this.data.entityName,
				columnName: this.data.columnName,
				fieldName: this.data.fieldName,
			}, this.schema, this.options)
		}
	}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.view) {
			return
		}
		if (this.options.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME) {
			renameConstraintsSqlBuilder(builder, entity, this.getNewConstraintName.bind(this))
		}
		this.renameColumnSubModification.createSql(builder)
	}

	public getSchemaUpdater(): SchemaUpdater {
		const updateConstraintName =
			this.options.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME
				? updateEntity(this.data.entityName, renameConstraintSchemaUpdater(this.getNewConstraintName.bind(this)))
				: undefined
		const updateConstraintFields =
			this.options.formatVersion >= VERSION_UPDATE_CONSTRAINT_NAME
				? updateEntity(this.data.entityName, ({ entity }) => {
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
			updateEveryField(({ field, entity }) => {
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
		const updateFieldName = updateEntity(this.data.entityName, ({ entity }) => {
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
			this.options.formatVersion >= VERSION_ACL_PATCH
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
							updateAclEveryPredicate(({ predicate, entityName, schema }) => {
								const processor = new PredicateDefinitionProcessor(schema.model)
								const currentEntity = schema.model.entities[entityName]
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
			updateAclOp,
			this.renameColumnSubModification.getSchemaUpdater(),
			updateModel(
				updateConstraintName,
				updateConstraintFields,
				updateRelationReferences,
				updateFieldName,
			),
		)
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
}

export interface UpdateFieldNameModificationData {
	entityName: string
	fieldName: string
	newFieldName: string
	columnName?: string
}

export const updateFieldNameModification = createModificationType({
	id: 'updateFieldName',
	handler: UpdateFieldNameModificationHandler,
})
