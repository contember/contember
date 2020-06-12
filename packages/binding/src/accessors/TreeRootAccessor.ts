import { GetEntityByKey } from './GetEntityByKey'
import { GetSubTree } from './GetSubTree'

// This allows us to have several parallel sub-trees without one having to be the main tree
// and all the other ones subordinate.
export class TreeRootAccessor {
	public constructor(public readonly getEntityByKey: GetEntityByKey, public readonly getSubTree: GetSubTree) {}
}
