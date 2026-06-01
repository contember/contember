import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions.js'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions.js'
import type { ExtendTree } from './ExtendTree.js'
import type { Persist } from './Persist.js'
import type { Environment } from '../environment/index.js'
import { ReceivedDataTree } from './QueryRequestResponse.js'
import { MarkerTreeRoot } from '../markers/index.js'
import { DataBindingEventListenerMap } from './DataBindingEvents.js'

export type FetchData<Node> = (fragment: Node, options?: { signal?: AbortSignal; environment?: Environment }) => Promise<{
	data: ReceivedDataTree
	markerTreeRoot: MarkerTreeRoot
}>

export type BatchDeferredUpdates = (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void

export interface BindingOperations<Node> extends AsyncBatchUpdatesOptions {
	addEventListener: <Type extends keyof DataBindingEventListenerMap>(
		event: Type,
		listener: DataBindingEventListenerMap[Type],
	) => () => void
	extendTree: ExtendTree<Node>
	fetchData: FetchData<Node>
	batchDeferredUpdates: BatchDeferredUpdates
	// discardSubTree: ...
	persist: Persist
}
