import { MigrationBuilder } from 'node-pg-migrate'
import { Schema, Model } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateEveryEntity, updateEveryField, updateModel } from '../schemaUpdateUtils'
import { Modification } from '../Modification'
import { acceptFieldVisitor } from '@contember/schema-utils'

class UpdateFieldNameModification implements Modification<UpdateFieldNameModification.Data> {
	constructor(private readonly data: UpdateFieldNameModification.Data, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
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
