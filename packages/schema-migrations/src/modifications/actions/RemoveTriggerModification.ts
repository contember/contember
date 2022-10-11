import { MigrationBuilder } from '@contember/database-migrations'
import { Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class RemoveTriggerModificationHandler implements ModificationHandler<RemoveTriggerModificationData> {
	constructor(private readonly data: RemoveTriggerModificationData) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const { [this.data.name]: _, ...triggers } = schema.actions.triggers
			return ({
				...schema,
				actions: {
					...schema.actions,
					triggers,
				},
			})
		}
	}

	describe() {
		return { message: `Remove trigger ${this.data.name}` }
	}
}

export interface RemoveTriggerModificationData {
	name: string
}

export const removeTriggerModification = createModificationType({
	id: 'removeTrigger',
	handler: RemoveTriggerModificationHandler,
})

export class RemoveTriggerDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(originalSchema.actions.triggers)
			.filter(([name]) => !updatedSchema.actions.triggers[name])
			.map(([name]) => removeTriggerModification.createModification({ name }))
	}
}
