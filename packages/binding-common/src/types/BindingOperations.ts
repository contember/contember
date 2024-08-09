import type { TreeFilter } from '@contember/client'
import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { ExtendTree } from './ExtendTree'
import type { Persist } from './Persist'
import type { Environment } from '../environment'
import { ReceivedDataTree } from './QueryRequestResponse'
import { MarkerTreeRoot } from '../markers'

export interface BindingOperations<Node> extends AsyncBatchUpdatesOptions {
	// addEventListener: ...
	getTreeFilters: () => TreeFilter[]

	extendTree: ExtendTree<Node>
	fetchData: (fragment: Node, options?: { signal?: AbortSignal; environment?: Environment }) => Promise<{
		data: ReceivedDataTree
		markerTreeRoot: MarkerTreeRoot
	} | undefined>
	batchDeferredUpdates: (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void
	// discardSubTree: ...
	persist: Persist
}
