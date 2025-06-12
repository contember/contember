import { Actions } from '@contember/schema'
import { SchemaUpdater } from '../utils/schemaUpdateUtils'
import { createModificationType, ModificationHandler } from '../ModificationHandler'
import { applyPatch, Operation } from 'rfc6902'
import deepCopy from '../../utils/deepCopy'

export class PatchTriggerModificationHandler implements ModificationHandler<PatchTriggerModificationData> {
	constructor(private readonly data: PatchTriggerModificationData) {}

	public createSql(): void {}

	public getSchemaUpdater(): SchemaUpdater {
		return ({ schema }) => {
			const trigger = deepCopy(schema.actions.triggers[this.data.triggerName])

			if (!trigger) {
				throw new Error(`Trigger ${this.data.triggerName} not found`)
			}

			const result = applyPatch(trigger, this.data.patch).filter(it => it !== null)
			if (result.length > 0) {
				throw result[0]
			}

			return {
				...schema,
				actions: {
					...schema.actions,
					triggers: {
						...schema.actions.triggers,
						[this.data.triggerName]: trigger,
					},
				},
			}
		}
	}

	describe() {
		return { message: `Patch trigger ${this.data.triggerName}` }
	}
}

export interface PatchTriggerModificationData {
	triggerName: string
	patch: Operation[]
}

export const patchTriggerModification = createModificationType({
	id: 'patchTrigger',
	handler: PatchTriggerModificationHandler,
})
