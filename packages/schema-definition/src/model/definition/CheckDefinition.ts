import { extendEntity } from './extensions.js'
import { DecoratorFunction } from '../../utils/index.js'
import { Model } from '@contember/schema'

export type CheckOptions = {
	/** Constraint name, unique within the entity. Used verbatim as the database constraint name. */
	name: string
	/** Raw SQL boolean expression over column names, e.g. `price >= 0`. */
	expression: string
}

export function Check<T>(options: CheckOptions): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const check: Model.CheckConstraint = { name: options.name, expression: options.expression }
		return {
			...entity,
			checks: [...entity.checks ?? [], check],
		}
	})
}
