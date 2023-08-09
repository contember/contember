import { Model } from '@contember/schema'
import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'


export type OrderByDirection = Model.OrderDirection | `${Model.OrderDirection}`
export type OrderByOptions = { path: string[]; direction?: OrderByDirection }


export function OrderBy<T>(options: OrderByOptions): DecoratorFunction<T>
export function OrderBy<T>(options: OrderByOptions[]): DecoratorFunction<T>
export function OrderBy<T>(path: (keyof T) & string, direction?: OrderByDirection): DecoratorFunction<T>
export function OrderBy<T>(options: OrderByOptions | OrderByOptions[] | ((keyof T) & string), direction?: `${Model.OrderDirection}`): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const normalize = (path: string[], direction?: OrderByDirection): Model.OrderBy => ({
			path,
			direction: (direction ?? Model.OrderDirection.asc) as Model.OrderDirection,
		})
		const orderBy = ((): Model.OrderBy[] => {
			if (Array.isArray(options)) {
				return options.map(it => normalize(it.path, it.direction))
			}
			if (typeof options === 'object') {
				return [normalize(options.path, options.direction)]
			}
			return [normalize([options], direction)]
		})()

		if (entity.orderBy?.length) {
			// eslint-disable-next-line no-console
			console.warn(`DEPRECATED: The "order by" property for the entity ${entity.name} has already been defined. Using multiple decorators can lead to unexpected order. Please provide an array containing all the 'order by' items as an input.`)
		}

		return {
			...entity,
			orderBy: [...(entity.orderBy ?? []), ...orderBy],
		}
	})
}
