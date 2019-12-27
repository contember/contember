import { Input, Model } from '@contember/schema'
import { getTargetEntity, getUniqueConstraints } from '@contember/schema-utils'
import { isUniqueWhere } from '../utils/inputUtils'

export default class UniqueWhereExpander {
	constructor(private readonly schema: Model.Schema) {}

	expand(entity: Model.Entity, where: Input.UniqueWhere): Input.Where {
		if (!isUniqueWhere(this.schema, entity, where)) {
			throw new UniqueWhereError(this.formatErrorMessage(entity, where))
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

	private formatErrorMessage(entity: Model.Entity, where: Input.UniqueWhere): string {
		return (
			'Unique where is not unique: \nProvided value:' +
			JSON.stringify(where) +
			'\nKnown unique keys:\n' +
			getUniqueConstraints(this.schema, entity)
				.map(it => it.fields.join(', '))
				.map(it => `\t - ${it}`)
				.join('\n')
		)
	}
}

export class UniqueWhereError extends Error {}
