import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater, updateModel } from '../utils/schemaUpdateUtils.js'
import { ModificationHandlerStatic } from '../ModificationHandler.js'

export const RemoveEnumModification: ModificationHandlerStatic<RemoveEnumModificationData> = class {
	static id = 'removeEnum'
	constructor(private readonly data: RemoveEnumModificationData, private readonly schema: Schema) {}

	public createSql(builder: MigrationBuilder): void {
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

	static createModification(data: RemoveEnumModificationData) {
		return { modification: this.id, ...data }
	}

	static createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(originalSchema.model.enums)
			.filter(([name]) => !updatedSchema.model.enums[name])
			.map(([enumName, values]) => RemoveEnumModification.createModification({ enumName }))
	}
}

export interface RemoveEnumModificationData {
	enumName: string
}
