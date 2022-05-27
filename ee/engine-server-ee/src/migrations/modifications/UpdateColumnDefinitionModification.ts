import {
	UpdateColumnDefinitionModificationHandler as BaseUpdateColumnDefinitionModificationHandler,
	updateColumnDefinitionModification as baseUpdateColumnDefinitionModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateColumnDefinitionModificationHandler extends BaseUpdateColumnDefinitionModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateColumnDefinitionModification = createModificationType({
	id: baseUpdateColumnDefinitionModification.id,
	handler: UpdateColumnDefinitionModificationHandler,
})
