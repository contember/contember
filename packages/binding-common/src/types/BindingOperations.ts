import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { ExtendTree } from './ExtendTree'
import type { Persist } from './Persist'
import type { Environment } from '../environment'
import { ReceivedDataTree } from './QueryRequestResponse'
import { MarkerTreeRoot } from '../markers'

export type FetchData<Node> = (fragment: Node, options?: { signal?: AbortSignal; environment?: Environment }) => Promise<{
	data: ReceivedDataTree
	markerTreeRoot: MarkerTreeRoot
}>

export type BatchDeferredUpdates = (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void

export interface BindingOperations<Node> extends AsyncBatchUpdatesOptions {
	// addEventListener: ...
	extendTree: ExtendTree<Node>
	fetchData: FetchData<Node>
	batchDeferredUpdates: BatchDeferredUpdates
	// discardSubTree: ...
	persist: Persist
}
