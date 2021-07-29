import { DecoratorFunction, EntityConstructor } from './types'

export type UniqueOptions<T> = { name?: string; fields: (keyof T)[] }
export function Unique<T>(options: UniqueOptions<T>): DecoratorFunction<T>
export function Unique<T>(...fields: (keyof T)[]): DecoratorFunction<T>
export function Unique<T>(options: UniqueOptions<T> | keyof T, ...fields: (keyof T)[]): DecoratorFunction<T> {
	if (typeof options !== 'object') {
		options = {
			fields: [options, ...fields],
		}
	}

	return function (cls: EntityConstructor<T>) {
		const keys = Reflect.getMetadata('uniqueKeys', cls) || []
		Reflect.defineMetadata('uniqueKeys', [...keys, options], cls)
	}
}
