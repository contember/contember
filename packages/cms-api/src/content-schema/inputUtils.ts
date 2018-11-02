import { Input, Model } from 'cms-common'
import { getTargetEntity } from './modelUtils'

export const isUniqueWhere = (schema: Model.Schema, entity: Model.Entity, where: Input.UniqueWhere): boolean => {
	if (where[entity.primary] !== undefined) {
		return true
	}
	uniqueKeys: for (const uniqueName in entity.unique) {
		for (const field of entity.unique[uniqueName].fields) {
			if (where[field] === undefined) {
				continue uniqueKeys
			} else {
				const target = getTargetEntity(schema, entity, field)
				if (target && !isUniqueWhere(schema, target, where[field] as Input.UniqueWhere)) {
					continue uniqueKeys
				}
			}
		}
		return true
	}
	return false
}
