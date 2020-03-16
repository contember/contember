import { MigrationBuilder } from 'node-pg-migrate'
import { Model, Schema } from '@contember/schema'
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
import { Modification } from '../Modification'
import { acceptFieldVisitor, PredicateDefinitionProcessor } from '@contember/schema-utils'
import { VERSION_ACL_PATCH } from '../ModificationVersions'

class UpdateFieldNameModification implements Modification<UpdateFieldNameModification.Data> {
	constructor(
		private readonly data: UpdateFieldNameModification.Data,
		private readonly schema: Schema,
		private readonly version: number,
	) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateSchema(
			updateModel(
				updateEveryEntity(
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
							visitOneHasOneOwner: (entity, relation, targetEntity, targetRelation) => {
								return isUpdatedRelation(targetEntity, targetRelation)
									? { ...relation, inversedBy: this.data.newFieldName }
									: relation
							},
							visitOneHasOneInversed: (entity, relation, targetEntity, targetRelation) => {
								return isUpdatedRelation(targetEntity, targetRelation)
									? { ...relation, ownedBy: this.data.newFieldName }
									: relation
							},
							visitManyHasManyOwner: (entity, relation, targetEntity, targetRelation) => {
								return isUpdatedRelation(targetEntity, targetRelation)
									? { ...relation, inversedBy: this.data.newFieldName }
									: relation
							},
							visitManyHasManyInversed: (entity, relation, targetEntity, targetRelation) => {
								return isUpdatedRelation(targetEntity, targetRelation)
									? { ...relation, ownedBy: this.data.newFieldName }
									: relation
							},
						})
					}),
				),
				updateEntity(this.data.entityName, entity => {
					const { [this.data.fieldName]: updated, ...fields } = entity.fields
					return {
						...entity,
						fields: {
							...fields,
							[this.data.newFieldName]: { ...updated, name: this.data.newFieldName },
						},
					}
				}),
			),
			this.version >= VERSION_ACL_PATCH
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
									return processor.process(currentEntity, predicate, {
										handleColumn: ctx =>
											ctx.entity.name === this.data.entityName && ctx.column.name === this.data.fieldName
												? [this.data.newFieldName, ctx.value]
												: ctx.value,
										handleRelation: ctx =>
											ctx.entity.name === this.data.entityName && ctx.relation.name === this.data.fieldName
												? [this.data.newFieldName, ctx.value]
												: ctx.value,
									})
								}),
							),
						),
				  )
				: undefined,
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}
}

namespace UpdateFieldNameModification {
	export const id = 'updateFieldName'

	export interface Data {
		entityName: string
		fieldName: string
		newFieldName: string
	}
}

export default UpdateFieldNameModification
