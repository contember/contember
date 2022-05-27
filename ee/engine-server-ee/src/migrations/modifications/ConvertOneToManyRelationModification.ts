import {
	ConvertOneToManyRelationModificationHandler as BaseConvertOneToManyRelationModificationHandler,
	convertOneToManyRelationModification as baseConvertOneToManyRelationModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class ConvertOneToManyRelationModificationHandler extends BaseConvertOneToManyRelationModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const convertOneToManyRelationModification = createModificationType({
	id: baseConvertOneToManyRelationModification.id,
	handler: ConvertOneToManyRelationModificationHandler,
})
