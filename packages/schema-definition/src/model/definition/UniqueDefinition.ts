import { extendEntity } from './extensions'
import { DecoratorFunction } from '../../utils'

export type UniqueOptions<T> = { fields: (keyof T)[] }
export function unique<T>(options: UniqueOptions<T>): DecoratorFunction<T>
export function unique<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function unique<T>(options: UniqueOptions<T> | keyof T, ...args: (keyof T)[]): DecoratorFunction<T> {
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


/**
 * @deprecated use "unique"
 */
export const Unique = unique
