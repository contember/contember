import { TreeFilter } from '@contember/client'
import { AsyncBatchUpdatesOptions } from './AsyncBatchUpdatesOptions'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { ExtendTree } from './ExtendTree'
import { Persist } from './Persist'

export interface BindingOperations extends AsyncBatchUpdatesOptions {
	// addEventListener: ...
	getTreeFilters: () => TreeFilter[]

	extendTree: ExtendTree
	batchDeferredUpdates: (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void
	// discardSubTree: ...
	persist: Persist
}
