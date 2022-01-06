import { Model } from '@contember/schema'

type ViewDependants = Map<string, Set<Model.Entity>>
export const getViewDirectDependants = (model: Model.Schema): ViewDependants => {
	const dependants: ViewDependants = new Map(Object.values(model.entities).filter(it => it.view).map(it => [it.name, new Set()]))
	for (const entity of Object.values(model.entities)) {
		if (!entity.view?.dependencies?.length) {
			continue
		}
		for (const dependency of entity.view.dependencies) {
			const entityDependants = dependants.get(dependency)
			if (!entityDependants) {
				// not a view
				continue
			}
			entityDependants.add(entity)
		}
	}
	return dependants
}
