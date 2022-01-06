import { extendEntity } from './extensions'
import { EntityConstructor } from './types'

export const View = (sql: string, { dependencies = [] }: { dependencies?: EntityConstructor[] } = {}) =>
	extendEntity(({ entity, registry }) => ({
		...entity,
		view: {
			sql,
			dependencies: dependencies.map(it => registry.getName(it)),
		},
	}))
