import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'

export type IndexOptions<T> = { fields: (keyof T)[] }
export function Index<T>(options: IndexOptions<T>): DecoratorFunction<T>
export function Index<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Index<T>(options: IndexOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const fields = (typeof options !== 'object' ? [options, ...args] : options.fields) as string[]
		return {
			...entity,
			indexes: [
				...entity.indexes,
				{ fields },
			],
		}
	})
}
