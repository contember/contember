import { Differ } from '../ModificationHandler'
import { Schema } from '@contember/schema'
import { updateFields } from '../utils/diffUtils'
import deepEqual from 'fast-deep-equal'
import { RemoveFieldModification } from '../fields'

export class RemoveChangedFieldDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return updateFields(originalSchema, updatedSchema, ({ updatedField, originalField, updatedEntity }) => {
			if (!deepEqual({ ...updatedField, inversedBy: undefined }, { ...originalField, inversedBy: undefined })) {
				return [
					RemoveFieldModification.createModification({
						entityName: updatedEntity.name,
						fieldName: updatedField.name,
					}),
				]
			}
		})
	}
}
