import { ExpectedEntityCount, SubTreeIdentifier } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'

export interface GetSubTree {
	(expectedCount: ExpectedEntityCount.UpToOne, identifier: SubTreeIdentifier):
		| EntityAccessor
		| EntityForRemovalAccessor
		| null
	(expectedCount: ExpectedEntityCount.PossiblyMany, identifier: SubTreeIdentifier): EntityListAccessor
}
