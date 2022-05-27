import {
	CreateEnumModificationHandler as BaseCreateEnumModificationHandler,
	createEnumModification as baseCreateEnumModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class CreateEnumModificationHandler extends BaseCreateEnumModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		if (this.data.migrations?.enabled !== false) {
			super.createSql(builder)
		}
	}
}

export const createEnumModification = createModificationType({
	id: baseCreateEnumModification.id,
	handler: CreateEnumModificationHandler,
})
