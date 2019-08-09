import { Input, Model } from '@contember/schema'
import { getTargetEntity } from '@contember/schema-utils'
import { isUniqueWhere } from '../../content-schema/inputUtils'

export default class UniqueWhereExpander {
	constructor(private readonly schema: Model.Schema) {}

	expand(entity: Model.Entity, where: Input.UniqueWhere): Input.Where {
		if (!isUniqueWhere(this.schema, entity, where)) {
			throw new Error('Unique where is not unique: ' + JSON.stringify(where))
		}

		const whereExpanded: Input.Where = {}
		for (const field in where) {
			const target = getTargetEntity(this.schema, entity, field)
			if (!target) {
				whereExpanded[field] = Array.isArray(where[field]) ? { in: where[field] as any } : { eq: where[field] }
			} else {
				whereExpanded[field] = this.expand(target, where[field] as Input.UniqueWhere)
			}
		}

		return whereExpanded
	}
}
