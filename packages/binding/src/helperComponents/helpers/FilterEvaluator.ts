import { Schema } from '../../core/schema'
import { Input } from '@contember/client'
import { EntityAccessor } from '../../accessors'
import { Filter } from '../../treeParameters'
import { BindingError } from '../../BindingError'
import { evaluateCondition } from './evaluateCondition'


export class FilterEvaluator {
	constructor(
		private readonly schema: Schema,
	) {
	}

	evaluateFilter(entity: EntityAccessor, filter: Filter): boolean {
		const entitySchema = this.schema.getEntity(entity.name)

		let acc = true
		for (const [key, value] of Object.entries(filter)) {
			if (key === 'and' || key === 'or') {
					if (!Array.isArray(value)) {
						throw new BindingError()
					}

					const operation = key === 'and' ? 'every' : 'some' as const
					acc &&= value[operation](it => this.evaluateFilter(entity, it))

			} else if (key === 'not') {
					acc &&= !this.evaluateFilter(entity, value as Filter)

			} else {
				const field = entitySchema.fields.get(key)
				if (!field) {
					throw new BindingError()
				}

				if (field.__typename === '_Column') {
					acc &&= evaluateCondition(entity.getField(key).value, value as Input.Condition)
				} else {
					acc &&= this.evaluateFilter(entity.getEntity(key), value as Filter)
				}
			}
		}
		return acc
	}
}
