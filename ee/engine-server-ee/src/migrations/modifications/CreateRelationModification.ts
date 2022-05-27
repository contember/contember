import {
	CreateRelationModificationHandler as BaseCreateRelationModificationHandler,
	createRelationModification as baseCreateRelationModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class CreateRelationModificationHandler extends BaseCreateRelationModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const createRelationModification = createModificationType({
	id: baseCreateRelationModification.id,
	handler: CreateRelationModificationHandler,
})
