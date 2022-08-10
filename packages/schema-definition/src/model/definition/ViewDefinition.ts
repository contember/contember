import { extendEntity } from './extensions'
import { EntityConstructor } from './types'

export const View = (sql: string, { dependencies }: { dependencies?: (() => EntityConstructor[]) | EntityConstructor[] } = {}) =>
	extendEntity(({ entity, registry }) => {
		const dependenciesResolved = typeof dependencies === 'function' ? dependencies() : dependencies
		if (dependenciesResolved?.some(it => it === undefined)) {
			throw `"undefined" value detected in dependencies of view entity ${entity.name}. This is possibly caused by circular imports.
Please wrap the array of dependencies into a function returning this array.

Instead of:
dependencies: [MyEntity]
Use:
dependencies: () => [MyEntity]
`
		}
		return ({
			...entity,
			view: {
				sql,
				...(dependenciesResolved ? { dependencies: dependenciesResolved.map(it => registry.getName(it)) } : {}),
			},
		})
	})
