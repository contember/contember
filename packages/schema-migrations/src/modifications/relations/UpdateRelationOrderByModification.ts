import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { SchemaUpdater, updateEntity, updateField, updateModel } from '../utils/schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { updateRelations } from '../utils/diffUtils'

export const UpdateRelationOrderByModification: ModificationHandlerStatic<UpdateRelationOrderByModificationData> = class {
	static id = 'updateRelationOrderBy'
	constructor(private readonly data: UpdateRelationOrderByModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		const { entityName, fieldName, orderBy } = this.data
		return updateModel(
			updateEntity(
				entityName,
				updateField<Model.AnyRelation & Model.OrderableRelation>(fieldName, ({ field }) => ({
					...field,
					orderBy,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Update order-by of relation ${this.data.entityName}.${this.data.fieldName}` }
	}

	static createModification(data: UpdateRelationOrderByModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateRelations(originalSchema, updatedSchema, ({ updatedRelation, originalRelation, updatedEntity }) => {
			const isItOrderable = (relation: Model.AnyRelation): relation is Model.OrderableRelation & Model.AnyRelation =>
				relation.type === Model.RelationType.ManyHasMany || relation.type === Model.RelationType.OneHasMany
			if (
				updatedRelation.type === originalRelation.type &&
				isItOrderable(updatedRelation) &&
				isItOrderable(originalRelation) &&
				!deepEqual(updatedRelation.orderBy || [], originalRelation.orderBy || [])
			) {
				return UpdateRelationOrderByModification.createModification({
					entityName: updatedEntity.name,
					fieldName: updatedRelation.name,
					orderBy: updatedRelation.orderBy || [],
				})
			}
			return undefined
		})
	}
}

export interface UpdateRelationOrderByModificationData {
	entityName: string
	fieldName: string
	orderBy: Model.OrderBy[]
}
