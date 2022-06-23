import { extendEntity } from './extensions.js'
import { EntityConstructor } from './types.js'

export const View = (sql: string, { dependencies }: { dependencies?: EntityConstructor[] } = {}) =>
	extendEntity(({ entity, registry }) => ({
		...entity,
		view: {
			sql,
			...(dependencies ? { dependencies: dependencies?.map(it => registry.getName(it)) } : {}),
		},
	}))
