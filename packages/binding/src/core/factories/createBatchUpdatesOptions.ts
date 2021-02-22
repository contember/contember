import { BatchUpdatesOptions, EntityAccessor, EntityListAccessor } from '../../accessors'
import { BindingError } from '../../BindingError'
import { Environment } from '../../dao'
import {
	Alias,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
	TreeRootId,
} from '../../treeParameters'
import { TreeStore } from '../TreeStore'

export const createBatchUpdatesOptions = (rootEnvironment: Environment, treeStore: TreeStore): BatchUpdatesOptions =>
	Object.freeze({
		getEntityByKey: key => {
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
