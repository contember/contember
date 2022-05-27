import {
	UpdateViewModificationHandler as BaseUpdateViewModificationHandler,
	updateViewModification as baseUpdateViewModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateViewModificationHandler extends BaseUpdateViewModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateViewModification = createModificationType({
	id: baseUpdateViewModification.id,
	handler: UpdateViewModificationHandler,
})
