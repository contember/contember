import { Model } from '@contember/schema'
import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'


export type OrderByOptions = { path: string[]; direction?: Model.OrderDirection }

export function OrderBy<T>(options: OrderByOptions): DecoratorFunction<T>
export function OrderBy<T>(path: (keyof T), direction?: Model.OrderDirection): DecoratorFunction<T>
export function OrderBy<T>(options: OrderByOptions | keyof T, direction?: Model.OrderDirection): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const path = (typeof options !== 'object' ? [options] : options.path) as string[]
		const dir =
			((typeof options === 'object' && options.direction)
				? options.direction
				: direction) ?? Model.OrderDirection.asc


		return {
			...entity,
			orderBy: [...(entity.orderBy ?? []), { path, direction: dir }],
		}
	})
}
