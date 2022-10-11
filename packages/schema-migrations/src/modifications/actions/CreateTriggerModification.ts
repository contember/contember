import { MigrationBuilder } from '@contember/database-migrations'
import { Actions, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'

export class CreateTriggerModificationHandler implements ModificationHandler<CreateTriggerModificationData> {
	constructor(private readonly data: CreateTriggerModificationData) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => ({
			...schema,
			actions: {
				...schema.actions,
				triggers: {
					...schema.actions.triggers,
					[this.data.trigger.name]: this.data.trigger,
				},
			},
		})
	}

	describe() {
		return { message: `Create trigger ${this.data.trigger.name}` }
	}
}

export interface CreateTriggerModificationData {
	trigger: Actions.AnyTrigger
}

export const createTriggerModification = createModificationType({
	id: 'createTrigger',
	handler: CreateTriggerModificationHandler,
})

export class CreateTriggerDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.actions.triggers)
			.filter(([name]) => !originalSchema.actions.triggers[name])
			.map(([, trigger]) => createTriggerModification.createModification({ trigger }))
	}
}
