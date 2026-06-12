import { Differ } from '../ModificationHandler.js'
import { Model, Schema } from '@contember/schema'
import deepEqual from 'fast-deep-equal'
import { Migration } from '../../Migration.js'
import { isReplaceableViewChange } from '../utils/viewDependencies.js'
import { updateViewModification } from '../entities/UpdateViewModification.js'

/**
 * Update a view in-place via `CREATE OR REPLACE VIEW` when only its definition
 * (sql/dependencies/idSource) changed and its output columns stayed the same.
 *
 * This avoids dropping & recreating the whole dependant-view cascade (and the
 * associated ACL / inverse-relation churn) that {@link RemoveViewDiffer} would
 * otherwise produce. Views that had to be recreated structurally are already
 * up to date in the running schema by the time this differ runs, so they are
 * naturally skipped here.
 */
export class UpdateViewDiffer implements Differ {
	createDiff(originalSchema: Schema, updatedSchema: Schema) {
		const candidates = Object.values(updatedSchema.model.entities).filter(updated => {
			const original = originalSchema.model.entities[updated.name]
			if (!original?.view || !updated.view) {
				return false
			}
			if (deepEqual(original.view, updated.view)) {
				return false // view unchanged
			}
			return isReplaceableViewChange(original, updated)
		})

		// emit dependencies before dependants so a (future) appended column is available to dependants
		const candidateNames = new Set(candidates.map(it => it.name))
		const visited = new Set<string>()
		const ordered: Model.Entity[] = []
		const visit = (entity: Model.Entity) => {
			if (visited.has(entity.name)) {
				return
			}
			visited.add(entity.name)
			for (const dependency of entity.view?.dependencies ?? []) {
				if (candidateNames.has(dependency)) {
					visit(updatedSchema.model.entities[dependency])
				}
			}
			ordered.push(entity)
		}
		for (const candidate of candidates) {
			visit(candidate)
		}

		return ordered.map((entity): Migration.Modification =>
			updateViewModification.createModification({
				entityName: entity.name,
				view: entity.view!,
			})
		)
	}
}
