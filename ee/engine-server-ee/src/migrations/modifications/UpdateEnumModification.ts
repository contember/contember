import {
	UpdateEnumModificationHandler as BaseUpdateEnumModificationHandler,
	updateEnumModification as baseUpdateEnumModification,
	createModificationType,
} from '@contember/schema-migrations'
import { MigrationBuilder } from '@contember/database-migrations'

export class UpdateEnumModificationHandler extends BaseUpdateEnumModificationHandler {
	public createSql(builder: MigrationBuilder): void {
		const enum_ = this.schema.model.enums[this.data.enumName]
		if (enum_.migrations.enabled) {
			super.createSql(builder)
		}
	}
}

export const updateEnumModification = createModificationType({
	id: baseUpdateEnumModification.id,
	handler: UpdateEnumModificationHandler,
})
