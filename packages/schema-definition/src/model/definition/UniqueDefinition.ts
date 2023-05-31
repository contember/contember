import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'

export type UniqueOptions<T> = { fields: (keyof T)[] }
export function Unique<T>(options: UniqueOptions<T>): DecoratorFunction<T>
export function Unique<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Unique<T>(options: UniqueOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
	return extendEntity(({ entity }) => {
		const fields = (typeof options !== 'object' ? [options, ...args] : options.fields) as string[]
		return {
			...entity,
			unique: [
				...entity.unique,
				{  fields },
			],
		}
	})
}
