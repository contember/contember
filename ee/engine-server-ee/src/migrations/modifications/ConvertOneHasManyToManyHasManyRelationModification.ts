import {
	ConvertOneHasManyToManyHasManyRelationModificationHandler as BaseConvertOneHasManyToManyHasManyRelationModificationHandler,
	convertOneHasManyToManyHasManyRelationModification as baseConvertOneHasManyToManyHasManyRelationModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class ConvertOneHasManyToManyHasManyRelationModificationHandler extends BaseConvertOneHasManyToManyHasManyRelationModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.schema.model.entities[this.data.entityName]
		if (entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const convertOneHasManyToManyHasManyRelationModification = createModificationType({
	id: baseConvertOneHasManyToManyHasManyRelationModification.id,
	handler: ConvertOneHasManyToManyHasManyRelationModificationHandler,
})
