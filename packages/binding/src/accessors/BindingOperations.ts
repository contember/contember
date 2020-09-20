import { TreeFilter } from '@contember/client'
import { EntityAccessor } from './EntityAccessor'
import { GetEntityByKey } from './GetEntityByKey'
import { GetEntityListSubTree } from './GetEntityListSubTree'
import { GetEntitySubTree } from './GetEntitySubTree'

export interface BindingOperations {
	// addEventListener: ...
	// triggerPersist: ...
	getEntityByKey: GetEntityByKey
	getEntityListSubTree: GetEntityListSubTree
	getEntitySubTree: GetEntitySubTree
	getAllEntities: () => Generator<EntityAccessor>
	getTreeFilters: () => TreeFilter[]
}
