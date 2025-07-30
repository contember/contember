import { DEFAULT_ENTITY_DEPRECATION_REASON } from '@contember/schema-utils'
import { extendEntity } from './extensions'

export const Deprecated = (deprecationReason?: string) =>
	extendEntity(({ entity }) => {
		return ({
			...entity,
			deprecationReason: deprecationReason || DEFAULT_ENTITY_DEPRECATION_REASON,
		})
	})
