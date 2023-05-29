import { Differ } from '../ModificationHandler'
import { Schema } from '@contember/schema'
import { isColumn } from '@contember/schema-utils'
import { removeFieldModification } from '../fields'

export class ToggleComputedColumnDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		return Object.values(updatedSchema.model.entities)
			.flatMap(entity => {
				return Object.values(entity.fields).map(it => [it, entity] as const)
			})
			.filter(([field, entity]) => {
				const origEntity = originalSchema.model.entities[entity.name]
				if (!origEntity) {
					return false
				}
				const origField = origEntity.fields[field.name]
				if (!origField) {
					return false
				}
				if (!isColumn(origField) || !isColumn(field)) {
					return false
				}
				return !!origField.computed !== !!field.computed
			})
			.map(([entity, field]) => removeFieldModification.createModification({ entityName: entity.name, fieldName: field.name }))
	}
}
