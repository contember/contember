import { Model } from '@contember/schema'
import deepEqual from 'fast-deep-equal'
import { Migration } from '../../Migration.js'
import { removeEntityModification } from '../entities/index.js'

/**
 * Determines whether a view change can be applied in-place via `CREATE OR REPLACE VIEW`,
 * i.e. without dropping & recreating the view (and cascading to its dependants).
 *
 * Postgres allows `CREATE OR REPLACE VIEW` only when the output columns stay the same
 * (it may append new columns at the end). We conservatively allow it only when the
 * entity is structurally identical and just the view metadata (`sql`/`dependencies`/`idSource`)
 * differs. Materialized views are never replaceable (no `CREATE OR REPLACE MATERIALIZED VIEW`).
 */
export const isReplaceableViewChange = (original: Model.Entity, updated: Model.Entity): boolean => {
	if (!original.view || !updated.view) {
		return false
	}
	if (original.view.materialized || updated.view.materialized) {
		return false
	}
	const stripView = (entity: Model.Entity): Omit<Model.Entity, 'view'> => {
		const { view, ...rest } = entity
		return rest
	}
	return deepEqual(stripView(original), stripView(updated))
}

type EntityDependantViews = Map<string, Set<Model.Entity>>
export const getEntityDependantViews = (model: Model.Schema): EntityDependantViews => {
	const dependants: EntityDependantViews = new Map(Object.values(model.entities).map(it => [it.name, new Set()]))
	for (const entity of Object.values(model.entities)) {
		if (!entity.view?.dependencies?.length) {
			continue
		}
		for (const dependency of entity.view.dependencies) {
			const entityDependants = dependants.get(dependency)
			if (!entityDependants) {
				throw new Error()
			}
			entityDependants.add(entity)
		}
	}
	return dependants
}

export const cascadeRemoveDependantViews = (model: Model.Schema, entities: Model.Entity[]): Migration.Modification[] => {
	const visited = new Set<string>()
	const dependants = getEntityDependantViews(model)
	const modifications: Migration.Modification[] = []
	const removeCascade = (entity: Model.Entity) => {
		if (visited.has(entity.name)) {
			return
		}
		visited.add(entity.name)
		for (const dependant of dependants.get(entity.name) ?? []) {
			removeCascade(dependant)
		}
		if (entity.view) {
			modifications.push(removeEntityModification.createModification({ entityName: entity.name }))
		}
	}
	for (const entity of entities) {
		removeCascade(entity)
	}
	return modifications
}
