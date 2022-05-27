import {
	RemoveEnumModificationHandler as BaseRemoveEnumModificationHandler,
	removeEnumModification as baseRemoveEnumModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class RemoveEnumModificationHandler extends BaseRemoveEnumModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const enum_ = this.schema.model.enums[this.data.enumName]
		if (enum_.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const removeEnumModification = createModificationType({
	id: baseRemoveEnumModification.id,
	handler: RemoveEnumModificationHandler,
})
