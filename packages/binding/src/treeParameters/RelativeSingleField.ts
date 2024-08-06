import type { AnyField } from './AnyField'
import type { HasOneRelation } from './HasOneRelation'
import type { LeafField } from './LeafField'

export type RelativeSingleField =
	& AnyField
	& LeafField
	& {
		hasOneRelationPath: HasOneRelation[]
	}
