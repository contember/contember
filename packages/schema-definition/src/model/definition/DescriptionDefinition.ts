import { extendEntity } from './extensions'

export const Description = (description: string) =>
	extendEntity(({ entity }) => {
		return {
			...entity,
			description,
		}
	})
