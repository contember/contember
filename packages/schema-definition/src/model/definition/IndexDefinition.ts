import { extendEntity } from './extensions.js'
import { DecoratorFunction } from '../../utils/index.js'
import { Model } from '@contember/schema'

export type IndexOptions<T> = {
	fields: (keyof T)[]
	method?: Model.IndexMethod
	opClass?: string
	where?: string
	include?: (keyof T)[]
}
export function Index<T>(options: IndexOptions<T>): DecoratorFunction<T>
export function Index<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Index<T>(options: IndexOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const indexDef = (typeof options !== 'object' ? { fields: [options, ...args] } : options) as Model.Index
		return {
			...entity,
			indexes: [
				...entity.indexes,
				indexDef,
			],
		}
	})
}
