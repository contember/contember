import { extendEntity } from './extensions'

export const View = (sql: string) =>
	extendEntity(entity => ({
		...entity,
		view: {
			sql,
		},
	}))
