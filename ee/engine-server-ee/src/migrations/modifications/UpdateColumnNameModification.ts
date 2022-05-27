import {
	UpdateColumnNameModificationHandler as BaseUpdateColumnNameModificationHandler,
	updateColumnNameModification as baseUpdateColumnNameModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateColumnNameModificationHandler extends BaseUpdateColumnNameModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateColumnNameModification = createModificationType({
	id: baseUpdateColumnNameModification.id,
	handler: UpdateColumnNameModificationHandler,
})
