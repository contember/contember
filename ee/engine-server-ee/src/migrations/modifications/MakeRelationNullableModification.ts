import {
	MakeRelationNullableModificationHandler as BaseMakeRelationNullableModificationHandler,
	makeRelationNullableModification as baseMakeRelationNullableModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class MakeRelationNullableModificationHandler extends BaseMakeRelationNullableModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const makeRelationNullableModification = createModificationType({
	id: baseMakeRelationNullableModification.id,
	handler: MakeRelationNullableModificationHandler,
})
