import { Input, Model } from 'cms-common'

export const isUniqueWhere = (entity: Model.Entity, where: Input.UniqueWhere): boolean => {
	if (where[entity.primary] !== undefined) {
		return true
	}
	uniqueKeys: for (const uniqueName in entity.unique) {
		for (const field of entity.unique[uniqueName].fields) {
			if (where[field] === undefined) {
				continue uniqueKeys
			}
		}
		return true
	}
	return false
}
