import { Model } from '@contember/schema'
import { DecoratorFunction } from './types'
import { extendEntity } from './extensions'


export type OrderByOptions = { path: string[]; direction?: Model.OrderDirection }

export function OrderBy<T>(path: (keyof T), direction: Model.OrderDirection): DecoratorFunction<T>
export function OrderBy<T>(options: OrderByOptions | keyof T, direction: Model.OrderDirection = Model.OrderDirection.asc): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const path = (typeof options !== 'object' ? [options] : options.path) as string[]
		const dir =
			((typeof options === 'object' && options.direction)
				? options.direction
				: direction) || Model.OrderDirection.asc


		return {
			...entity,
			orderBy: entity.orderBy ? [...entity.orderBy, ...[{
				path,
				direction: dir,
			}]] : [{
				path,
				direction: dir,
			}],
		}
	})
}
