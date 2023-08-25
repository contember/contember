import { Differ } from '../ModificationHandler'
import { Schema } from '@contember/schema'
import deepEqual from 'fast-deep-equal'
import { cascadeRemoveDependantViews } from '../utils/viewDependencies'
import { UpdateColumnDefinitionDiffer } from '../columns'

/**
 * Remove changed or removed view.
 */
export class RemoveViewDiffer implements Differ {
	constructor() {
	}

	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const changedOrRemovedViews = Object.values(originalSchema.model.entities)
			.filter(it => {
				const updatedEntity = updatedSchema.model.entities[it.name]

				if (!updatedEntity && !!it.view) {
					return true // view entity removed
				}

				if (!updatedEntity) {
					return false // non-view entity removed
				}

				if (!updatedEntity.view && !it.view) {
					return false // none is view
				}

				if (!!it.view !== !!updatedEntity.view) {
					return true // change between regular entity and view entity
				}

				if (!deepEqual(updatedEntity.view, it.view)) {
					return true // view is different
				}

				return false
			})

		const columnDiffer = new UpdateColumnDefinitionDiffer()
		const columnChanges = columnDiffer.createDiff(originalSchema, updatedSchema)
		if (changedOrRemovedViews.length === 0 && columnChanges.length === 0) {
			return []
		}

		const changedColumnsEntities = Array.from(new Set(columnChanges.map(it => it.entityName)))
			.map(it => originalSchema.model.entities[it])
		return cascadeRemoveDependantViews(originalSchema.model, [...changedOrRemovedViews, ...changedColumnsEntities])
	}
}
