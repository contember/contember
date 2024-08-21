import type { BatchUpdatesOptions, EntityAccessor, EntityListAccessor } from '@contember/binding-common'
import { BindingError } from '@contember/binding-common'
import type { Environment } from '@contember/binding-common'
import type {
	Alias,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '@contember/binding-common'
import type { TreeStore } from '../TreeStore'

export const createBatchUpdatesOptions = (rootEnvironment: Environment, treeStore: TreeStore): BatchUpdatesOptions =>
	Object.freeze({
		getEntityByKey: (key: string | (() => EntityAccessor)) => {
			if (typeof key === 'function') {
				return key()
			}
			const realm = treeStore.entityRealmStore.get(key)

			if (realm === undefined) {
				throw new BindingError(`Trying to retrieve a non-existent entity: key '${key}' was not found.`)
			}
			return realm.getAccessor()
		},
		getEntityListSubTree: (
			aliasOrParameters: Alias | SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
			treeId: TreeRootId | undefined,
			environment = rootEnvironment,
		): EntityListAccessor => {
			return treeStore.getSubTreeState('entityList', treeId, aliasOrParameters, environment).getAccessor()
		},
		getEntitySubTree: (
			aliasOrParameters: Alias | SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
			treeId: TreeRootId | undefined,
			environment = rootEnvironment,
		): EntityAccessor => {
			return treeStore.getSubTreeState('entity', treeId, aliasOrParameters, environment).getAccessor()
		},
	})
