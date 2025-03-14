import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'
import { Model } from '@contember/schema'

export type UniqueOptions<T> = {
	fields: (keyof T & string)[]

} & (
	| {
		index?: false
		timing?: Model.ConstraintTiming
	}
	| {
		index: true
		nulls?: Model.NullsDistinctBehaviour
	}
)
export function Unique<T>(options: UniqueOptions<T>): DecoratorFunction<T>
export function Unique<T>(...fields: (keyof T & string)[]): DecoratorFunction<T>
export function Unique<T>(options: UniqueOptions<T> | keyof T & string, ...args: (keyof T & string)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const unique = typeof options !== 'object'
			? { fields: [options, ...args] }
			: options
		return {
			...entity,
			unique: [
				...entity.unique,
				unique,
			],
		}
	})
}
