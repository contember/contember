import { Differ } from '../ModificationHandler.js'
import { Model, Schema } from '@contember/schema'
import { updateFields } from '../utils/diffUtils.js'
import { deepEqual } from '@contember/utilities'
import { removeFieldModification } from '../fields/index.js'

export class RemoveChangedFieldDiffer implements Differ {
	constructor(
		private readonly matcher: (originalField: Model.AnyField) => boolean,
	) {
	}

	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateFields(originalSchema, updatedSchema, ({ updatedField, originalField, updatedEntity }) => {
			if (!this.matcher(originalField)) {
				return undefined
			}
			if (!deepEqual({ ...updatedField, inversedBy: undefined }, { ...originalField, inversedBy: undefined })) {
				return [
					removeFieldModification.createModification({
						entityName: updatedEntity.name,
						fieldName: updatedField.name,
					}),
				]
			}
		})
	}
}
