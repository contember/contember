import { Differ } from '../ModificationHandler.js'
import { Schema } from '@contember/schema'
import deepEqual from 'fast-deep-equal'
import { cascadeRemoveDependantViews, isReplaceableViewChange } from '../utils/viewDependencies.js'
import { UpdateColumnDefinitionDiffer } from '../columns/index.js'

/**
 * Remove views that were removed or changed in a way that requires a drop & recreate.
 *
 * View changes that can be applied in-place via `CREATE OR REPLACE VIEW` (see
 * {@link isReplaceableViewChange}) are intentionally skipped here so they don't trigger
 * the drop cascade onto dependant views – those are handled by `UpdateViewDiffer`.
 */
export class RemoveViewDiffer implements Differ {
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
					// view changed – cascade only when it cannot be replaced in-place
					return !isReplaceableViewChange(it, updatedEntity)
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
