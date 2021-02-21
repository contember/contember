import { TreeFilter } from '@contember/client'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { ExtendTree } from './ExtendTree'
import { Persist } from './Persist'

export interface BindingOperations extends BatchUpdatesOptions {
	// addEventListener: ...
	getTreeFilters: () => TreeFilter[]

	extendTree: ExtendTree
	batchDeferredUpdates: (performUpdates: (bindingOperations: BatchUpdatesOptions) => void) => void
	// discardSubTree: ...
	persist: Persist
}
