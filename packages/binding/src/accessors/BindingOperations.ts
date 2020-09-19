import { TreeFilter } from '@contember/client'
import { EntityAccessor } from './EntityAccessor'
import { GetEntityByKey } from './GetEntityByKey'
import { GetSubTree } from './GetSubTree'

export interface BindingOperations {
	// addEventListener: ...
	// triggerPersist: ...
	getEntityByKey: GetEntityByKey
	getSubTree: GetSubTree
	getAllEntities: () => Generator<EntityAccessor>
	getTreeFilters: () => TreeFilter[]
}
