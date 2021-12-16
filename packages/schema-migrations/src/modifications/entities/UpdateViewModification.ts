import { MigrationBuilder } from '@contember/database-migrations'
import { Model, Schema } from '@contember/schema'
import { ModificationHandlerStatic } from '../ModificationHandler'
import { SchemaUpdater, updateEntity, updateModel } from '../utils/schemaUpdateUtils'

export const UpdateViewModification: ModificationHandlerStatic<UpdateViewModificationData> = class {
	static id = 'updateView'

	constructor(private readonly data: UpdateViewModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		builder.dropView(entity.tableName, { ifExists: true })
		builder.createView(
			entity.tableName,
			{},
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

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.filter((it): it is Model.Entity & Required<Pick<Model.Entity, 'view'>> => {
				const origView = originalSchema.model.entities[it.name]?.view
				return !!it.view?.sql && !!origView && origView?.sql !== it.view.sql
			})
			.map(it =>
				UpdateViewModification.createModification({
					entityName: it.name,
					view: it.view,
				}),
			)
	}
}

export interface UpdateViewModificationData {
	entityName: string
	view: Model.View
}
