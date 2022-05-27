import {
	CreateViewModificationHandler as BaseCreateViewModificationHandler,
	createViewModification as baseCreateViewModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class CreateViewModificationHandler extends BaseCreateViewModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		if (this.data.entity.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const createViewModification = createModificationType({
	id: baseCreateViewModification.id,
	handler: CreateViewModificationHandler,
})
