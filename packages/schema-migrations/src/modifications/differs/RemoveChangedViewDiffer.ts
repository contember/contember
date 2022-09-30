import { Differ } from '../ModificationHandler'
import { Schema } from '@contember/schema'
import deepEqual from 'fast-deep-equal'
import { cascadeRemoveDependantViews } from '../utils/viewDependencies'
import { UpdateColumnDefinitionDiffer } from '../columns'

export class RemoveChangedViewDiffer implements Differ {
	constructor() {
	}

	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const changedViews = Object.values(originalSchema.model.entities)
			.filter(it => {
				const updatedEntity = updatedSchema.model.entities[it.name]
				if (!updatedEntity || !it.view || !updatedEntity.view) {
					return false
				}
				return !deepEqual(updatedEntity.view, it.view)
			})
		const columnDiffer = new UpdateColumnDefinitionDiffer()
		const columnChanges = columnDiffer.createDiff(originalSchema, updatedSchema)
		if (changedViews.length === 0 && columnChanges.length === 0) {
			return []
		}
		const changedColumnsEntities = Array.from(new Set(columnChanges.map(it => it.entityName)))
			.map(it => originalSchema.model.entities[it])
		return cascadeRemoveDependantViews(originalSchema.model, [...changedViews, ...changedColumnsEntities])
	}
}
