import { Input, Model } from 'cms-common'

export const isUniqueWhere = (entity: Model.Entity, where: Input.UniqueWhere): boolean => {
	if (where[entity.primary] !== undefined) {
		return true
	}
	uniqueKeys: for (const unique of entity.unique.map(it => it.fields)) {
		for (const field of unique) {
			if (where[field] === undefined) {
				continue uniqueKeys
			}
		}
		return true
	}
	return false
}
