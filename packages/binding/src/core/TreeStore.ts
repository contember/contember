import { PersistedEntityDataStore } from '../accessorTree'
import { MarkerTreeRoot } from '../markers'
import { EntityState, RootStateNode } from './state'

export class TreeStore {
	// TODO deletes and disconnects cause memory leaks here as they don't traverse the tree to remove nested states.
	//  This could theoretically also be intentional given that both operations happen relatively infrequently,
	//  or at least rarely enough that we could potentially just ignore the problem (which we're doing now).
	//  Nevertheless, no real analysis has been done and it could turn out to be a problem.
	public readonly entityStore: Map<string, EntityState> = new Map()
	public readonly subTreeStates: Map<string, RootStateNode> = new Map()

	// TODO !!!
	public markerTree: MarkerTreeRoot = new MarkerTreeRoot(new Map(), new Map())
	public persistedEntityData: PersistedEntityDataStore = new Map()
}
