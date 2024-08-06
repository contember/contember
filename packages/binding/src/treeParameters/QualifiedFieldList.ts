import type { AnyField } from './AnyField'
import type { EntityListParameters } from './EntityListParameters'
import type { HasOneRelation } from './HasOneRelation'
import type { LeafField } from './LeafField'
import type { QualifiedEntityParameters } from './QualifiedEntityParameters'

export type QualifiedFieldList =
	& EntityListParameters
	& QualifiedEntityParameters
	& AnyField
	& LeafField
	& {
		hasOneRelationPath: HasOneRelation[]
	}
