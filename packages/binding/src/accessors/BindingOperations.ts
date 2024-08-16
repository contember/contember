import type { TreeFilter } from '@contember/client'
import type { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { ExtendTree } from './ExtendTree'
import type { Persist } from './Persist'

export interface BindingOperations<Node> extends AsyncBatchUpdatesOptions {
	// addEventListener: ...
	getTreeFilters: () => TreeFilter[]

	extendTree: ExtendTree<Node>
	batchDeferredUpdates: (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void
	// discardSubTree: ...
	persist: Persist
}
