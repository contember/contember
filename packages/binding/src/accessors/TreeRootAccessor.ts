import { GetSubTree } from './GetSubTree'
import { SubTreeContainer } from './SubTreeContainer'

// This allows us to have several parallel sub-trees without one having to be the main tree
// and all the other ones subordinate.
export class TreeRootAccessor implements SubTreeContainer {
	public constructor(public readonly getSubTree: GetSubTree) {}
}
