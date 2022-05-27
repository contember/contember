import {
	RemoveUniqueConstraintModificationHandler as BaseRemoveUniqueConstraintModificationHandler,
	removeUniqueConstraintModification as baseRemoveUniqueConstraintModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class RemoveUniqueConstraintModificationHandler extends BaseRemoveUniqueConstraintModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const removeUniqueConstraintModification = createModificationType({
	id: baseRemoveUniqueConstraintModification.id,
	handler: RemoveUniqueConstraintModificationHandler,
})
