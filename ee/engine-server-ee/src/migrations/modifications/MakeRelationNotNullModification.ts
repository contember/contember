import {
	MakeRelationNotNullModificationHandler as BaseMakeRelationNotNullModificationHandler,
	makeRelationNotNullModification as baseMakeRelationNotNullModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class MakeRelationNotNullModificationHandler extends BaseMakeRelationNotNullModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const makeRelationNotNullModification = createModificationType({
	id: baseMakeRelationNotNullModification.id,
	handler: MakeRelationNotNullModificationHandler,
})
