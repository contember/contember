import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class RemoveEnumModificationHandler implements ModificationHandler<RemoveEnumModificationData> {
	constructor(private readonly data: RemoveEnumModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
		const enum_ = this.schema.model.enums[this.data.enumName]
		if (!enum_.migrations.enabled) {
			return
		}
		builder.dropDomain(this.data.enumName)
	}

	public getSchemaUpdater(): SchemaUpdater {
		return updateModel(({ model }) => {
			const { [this.data.enumName]: removedEnum, ...enums } = model.enums
			return {
				...model,
				enums,
			}
		})
	}

	describe() {
		return { message: `Remove ${this.data.enumName}` }
	}
}

export interface RemoveEnumModificationData {
	enumName: string
}

export const removeEnumModification = createModificationType({
	id: 'removeEnum',
	handler: RemoveEnumModificationHandler,
})

export class RemoveEnumDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(originalSchema.model.enums)
			.filter(([name]) => !updatedSchema.model.enums[name])
			.map(([enumName, values]) => removeEnumModification.createModification({ enumName }))
	}
}
