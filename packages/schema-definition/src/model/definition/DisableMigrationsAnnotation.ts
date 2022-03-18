import { extendEntity } from './extensions'

export const DisableMigrations = () =>
	extendEntity(({ entity }) => ({
		...entity,
		migrations: {
			enabled: false,
		},
	}))
