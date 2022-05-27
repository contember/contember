import {
	RemoveEntityModificationHandler as BaseRemoveEntityModificationHandler,
	removeEntityModification as baseRemoveEntityModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class RemoveEntityModificationHandler extends BaseRemoveEntityModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const removeEntityModification = createModificationType({
	id: baseRemoveEntityModification.id,
	handler: RemoveEntityModificationHandler,
})
