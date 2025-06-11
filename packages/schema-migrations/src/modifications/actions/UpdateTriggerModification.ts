import { Actions, Schema } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, Differ, ModificationHandler } from '../ModificationHandler'
import deepEqual from 'fast-deep-equal'
import { createPatch } from 'rfc6902'
import { patchTriggerModification } from './PatchTriggerModification'

export class UpdateTriggerModificationHandler implements ModificationHandler<UpdateTriggerModificationData> {
	constructor(private readonly data: UpdateTriggerModificationData) {
	}

	public createSql(): void {
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
	constructor(
		private readonly options?: {
			maxPatchSize?: number
		},
	) {
	}

	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.entries(updatedSchema.actions.triggers)
			.filter(([name, trigger]) => originalSchema.actions.triggers[name] && !deepEqual(trigger, originalSchema.actions.triggers[name]))
			.map(([name, trigger]) => {
				const originalTrigger = originalSchema.actions.triggers[name]

				const patch = createPatch(originalTrigger, trigger)
				if (patch.length <= (this.options?.maxPatchSize ?? 100)) {
					return patchTriggerModification.createModification({
						triggerName: name,
						patch,
					})
				}

				return updateTriggerModification.createModification({ trigger })
			})
	}
}
