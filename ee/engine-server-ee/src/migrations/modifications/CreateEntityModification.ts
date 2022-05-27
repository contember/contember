import {
	CreateEntityModificationHandler as BaseCreateEntityModificationHandler,
	createEntityModification as baseCreateEntityModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class CreateEntityModificationHandler extends BaseCreateEntityModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const entity = this.data.entity
		if (entity.migrations?.enabled !== false) {
			super.createSql(builder)
		}
	}
}

export const createEntityModification = createModificationType({
	id: baseCreateEntityModification.id,
	handler: CreateEntityModificationHandler,
})
