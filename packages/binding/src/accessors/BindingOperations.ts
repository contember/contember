import { TreeFilter } from '@contember/client'
import { EntityAccessor } from './EntityAccessor'
import { ExtendTree } from './ExtendTree'
import { GetEntityByKey } from './GetEntityByKey'
import { GetEntityListSubTree } from './GetEntityListSubTree'
import { GetEntitySubTree } from './GetEntitySubTree'
import { Persist } from './Persist'

export interface BindingOperations {
	// addEventListener: ...
	getEntityByKey: GetEntityByKey
	getEntityListSubTree: GetEntityListSubTree
	getEntitySubTree: GetEntitySubTree
	getAllEntities: () => Generator<EntityAccessor>
	getTreeFilters: () => TreeFilter[]

	extendTree: ExtendTree
	batchDeferredUpdates: (performUpdates: (bindingOperations: BindingOperations) => void) => void
	// discardSubTree: ...
	persist: Persist
}
