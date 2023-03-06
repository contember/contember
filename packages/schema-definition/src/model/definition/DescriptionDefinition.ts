import { extendEntity } from './extensions'
import { EntityConstructor } from './types'

export const Description = (description: string) =>
	extendEntity(({ entity, registry }) => {
		return ({
			...entity,
			description,
		})
	})
