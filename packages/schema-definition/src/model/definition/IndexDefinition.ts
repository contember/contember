import { extendEntity } from './extensions'
import { NamingHelper } from '@contember/schema-utils'
import { DecoratorFunction } from '../../utils'

export type IndexOptions<T> = { name?: string; fields: (keyof T)[] }
export function Index<T>(options: IndexOptions<T>): DecoratorFunction<T>
export function Index<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Index<T>(options: IndexOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const fields = (typeof options !== 'object' ? [options, ...args] : options.fields) as string[]
		const name =
			typeof options === 'object' && options.name
				? options.name
				: NamingHelper.createIndexName(entity.name, fields)
		return {
			...entity,
			indexes: {
				...entity.indexes,
				[name]: { name, fields },
			},
		}
	})
}
