import {
	UpdateEntityNameModificationHandler as BaseUpdateEntityNameModificationHandler,
	updateEntityNameModification as baseUpdateEntityNameModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateEntityNameModificationHandler extends BaseUpdateEntityNameModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateEntityNameModification = createModificationType({
	id: baseUpdateEntityNameModification.id,
	handler: UpdateEntityNameModificationHandler,
})
