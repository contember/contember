import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'
import { Model } from '@contember/schema'

export type IndexOptions<T> = {
	fields: (keyof T)[]
	method?: Model.IndexMethod
}
export function Index<T>(options: IndexOptions<T>): DecoratorFunction<T>
export function Index<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Index<T>(options: IndexOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const indexDef = (typeof options !== 'object' ? { fields: [options, ...args] } : options) as { fields: string[]; method?: Model.IndexMethod }
		return {
			...entity,
			indexes: [
				...entity.indexes,
				indexDef,
			],
		}
	})
}
