import { TreeFilter } from '@contember/client'
import { SubTreeMarkerParameters } from '../markers'
import { Alias } from '../treeParameters/primitives'
import { EntityAccessor } from './EntityAccessor'
import { ExtendTree } from './ExtendTree'
import { GetEntityByKey } from './GetEntityByKey'
import { GetEntityListSubTree } from './GetEntityListSubTree'
import { GetEntitySubTree } from './GetEntitySubTree'
import { Persist } from './Persist'

export interface BindingOperations {
	// addEventListener: ...
	hasEntityKey: (key: string) => boolean
	hasSubTree: (aliasOrParameters: Alias | SubTreeMarkerParameters) => boolean
	getEntityByKey: GetEntityByKey
	getEntityListSubTree: GetEntityListSubTree
	getEntitySubTree: GetEntitySubTree
	getTreeFilters: () => TreeFilter[]

	extendTree: ExtendTree
	batchDeferredUpdates: (performUpdates: (bindingOperations: BindingOperations) => void) => void
	// discardSubTree: ...
	persist: Persist
}
