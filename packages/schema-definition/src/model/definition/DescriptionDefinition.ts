import { extendEntity } from './extensions.js'

export const Description = (description: string) =>
	extendEntity(({ entity }) => {
		return {
			...entity,
			description,
		}
	})
