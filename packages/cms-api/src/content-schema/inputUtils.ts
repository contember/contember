import { Input, Model } from 'cms-common'
import { getTargetEntity, getUniqueConstraints } from './modelUtils'

export const isUniqueWhere = (schema: Model.Schema, entity: Model.Entity, where: Input.UniqueWhere): boolean => {
	if (where[entity.primary] !== undefined) {
		return true
	}
	uniqueKeys: for (const unique of getUniqueConstraints(schema, entity)) {
		for (const field of unique.fields) {
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
