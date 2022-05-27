import {
	UpdateFieldNameModificationHandler as BaseUpdateFieldNameModificationHandler,
	updateFieldNameModification as baseUpdateFieldNameModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateFieldNameModificationHandler extends BaseUpdateFieldNameModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateFieldNameModification = createModificationType({
	id: baseUpdateFieldNameModification.id,
	handler: UpdateFieldNameModificationHandler,
})
