import { Model } from '@contember/schema'
import { Migration } from '../../Migration'
import { removeEntityModification } from '../entities'

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
