import {
	RemoveFieldModificationHandler as BaseRemoveFieldModificationHandler,
	removeFieldModification as baseRemoveFieldModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class RemoveFieldModificationHandler extends BaseRemoveFieldModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const removeFieldModification = createModificationType({
	id: baseRemoveFieldModification.id,
	handler: RemoveFieldModificationHandler,
})
