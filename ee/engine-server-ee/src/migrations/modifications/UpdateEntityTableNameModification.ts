import {
	UpdateEntityTableNameModificationHandler as BaseUpdateEntityTableNameModificationHandler,
	updateEntityTableNameModification as baseUpdateEntityTableNameModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateEntityTableNameModificationHandler extends BaseUpdateEntityTableNameModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateEntityTableNameModification = createModificationType({
	id: baseUpdateEntityTableNameModification.id,
	handler: UpdateEntityTableNameModificationHandler,
})
