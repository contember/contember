import { Model } from '@contember/schema'
import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'


export type OrderByOptions = { path: string[]; direction?: Model.OrderDirection | `${Model.OrderDirection}` }


export function orderBy<T>(options: OrderByOptions): DecoratorFunction<T>


export function orderBy<T>(path: (keyof T), direction?: Model.OrderDirection | `${Model.OrderDirection}`): DecoratorFunction<T>
export function orderBy<T>(options: OrderByOptions | keyof T, direction?: `${Model.OrderDirection}`): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const path = (typeof options !== 'object' ? [options] : options.path) as string[]
		const dir = (((typeof options === 'object' && options.direction)
			? options.direction
			: direction) ?? Model.OrderDirection.asc) as Model.OrderDirection


		return {
			...entity,
			orderBy: [...(entity.orderBy ?? []), { path, direction: dir }],
		}
	})
}

/**
 * @deprecated use "orderBy"
 */
export const OrderBy = orderBy
