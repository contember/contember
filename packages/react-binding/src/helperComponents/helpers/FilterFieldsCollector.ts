import { Schema, SchemaEntity } from '@contember/binding'
import { Filter } from '@contember/binding'
import { BindingError } from '@contember/binding'

export class FilterFieldsCollector {
	constructor(
		private readonly schema: Schema,
		private readonly rootFilter: Filter,
	) {
	}


	collectFields(entity: SchemaEntity): Set<string> {
		const result = new Set<string>()
		this.collectFieldsInternal(this.rootFilter, entity, [], result)
		return result
	}

	private collectFieldsInternal(filter: Filter, entity: SchemaEntity, path: string[], result: Set<string>): void {
		for (const [key, value] of Object.entries(filter)) {
			if (key === 'and' || key === 'or') {
					if (!Array.isArray(value)) {
						throw new BindingError()
					}
					value?.forEach(it => this.collectFieldsInternal(it, entity, path, result))

			} else if (key === 'not') {
					this.collectFieldsInternal(value as Filter, entity, path, result)

			} else {
				const field = entity.fields.get(key)
				if (!field) {
					throw new BindingError(`Invalid field: the name "${key}" does not exist on entity "${entity.name}" `
						+ `in a ${path.length === 0 ? 'root' : `path "${path.join('.')}"`} of a following filter:\n`
						+ JSON.stringify(this.rootFilter, null, '  '))
				}
				if (field.__typename === '_Column') {
					result.add([...path, key].join('.'))
				} else {
					const entity = this.schema.getEntity(field.targetEntity)
					this.collectFieldsInternal(value as Filter, entity, [...path, key], result)
				}
			}
		}
	}
}
