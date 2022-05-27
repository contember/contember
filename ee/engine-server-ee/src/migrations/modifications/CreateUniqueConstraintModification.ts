import {
	CreateUniqueConstraintModificationHandler as BaseCreateUniqueConstraintModificationHandler,
	createUniqueConstraintModification as baseCreateUniqueConstraintModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class CreateUniqueConstraintModificationHandler extends BaseCreateUniqueConstraintModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const createUniqueConstraintModification = createModificationType({
	id: baseCreateUniqueConstraintModification.id,
	handler: CreateUniqueConstraintModificationHandler,
})
