import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'

export const UpdateViewModification: ModificationHandlerStatic<UpdateViewModificationData> = class {
	static id = 'updateView'

	constructor(private readonly data: UpdateViewModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		builder.createView(
			entity.tableName,
			{
				replace: true,
			},
			this.data.view.sql,
		)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(
			updateEntity(this.data.entityName, ({ entity }) => ({
				...entity,
				view: this.data.view,
			})),
		)
	}

	describe() {
		return { message: `Update SQL definition of a view` }
	}

	static createModification(data: UpdateViewModificationData) {
		return { modification: this.id, ...data }
	}
}

export interface UpdateViewModificationData {
	entityName: string
	view: Model.View
}
