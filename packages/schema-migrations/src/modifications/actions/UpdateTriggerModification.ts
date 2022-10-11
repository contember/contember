import { MigrationBuilder } from '@contember/database-migrations'
import { Actions, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'

export class UpdateTriggerModificationHandler implements ModificationHandler<UpdateTriggerModificationData> {
	constructor(private readonly data: UpdateTriggerModificationData) {
	}

	public createSql(builder: MigrationBuilder): void {
	}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			return ({
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
	}

	describe() {
		return { message: `Update trigger ${this.data.trigger.name}` }
	}
}

export interface UpdateTriggerModificationData {
	trigger: Actions.AnyTrigger
}

export const updateTriggerModification = createModificationType({
	id: 'updateTrigger',
	handler: UpdateTriggerModificationHandler,
})

export class UpdateTriggerDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.actions.triggers)
			.filter(([name, trigger]) => originalSchema.actions.triggers[name] && !deepEqual(trigger, originalSchema.actions.triggers[name]))
			.map(([, trigger]) => updateTriggerModification.createModification({ trigger }))
	}
}
