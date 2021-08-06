import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ContentEvent } from '@contember/engine-common'
import { addField, SchemaUpdater, updateEntity, updateField, updateModel } from '../schemaUpdateUtils'
import { ModificationHandlerStatic } from '../ModificationHandler'

export const CreateRelationInverseSideModification: ModificationHandlerStatic<CreateRelationInverseSideModificationData> = class {
	static id = 'createRelationInverseSide'
	constructor(private readonly data: CreateRelationInverseSideModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, addField(this.data.relation)),
			updateEntity(
				this.data.relation.target,
				updateField<Model.AnyRelation & Model.OwningRelation>(this.data.relation.ownedBy, field => ({
					...field,
					inversedBy: this.data.relation.name,
				})),
			),
		)
	}

	public transformEvents(events: ContentEvent[]): ContentEvent[] {
		return events
	}

	describe() {
		return { message: `Add relation ${this.data.entityName}.${this.data.relation.name}` }
	}

	static createModification(data: CreateRelationInverseSideModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface CreateRelationInverseSideModificationData {
	entityName: string
	relation: Model.AnyRelation & Model.InverseRelation
}
