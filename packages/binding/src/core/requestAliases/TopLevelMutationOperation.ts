import type { EntityId, PlaceholderName, TreeRootId } from '../../treeParameters'
import type { mutationOperationSubTreeType } from './mutationOperationSubTreeType'
import type { mutationOperationType } from './mutationOperationType'

export interface TopLevelMutationOperation {
	treeRootId: TreeRootId | undefined
	subTreePlaceholder: PlaceholderName
	type: typeof mutationOperationType[keyof typeof mutationOperationType]
	subTreeType: typeof mutationOperationSubTreeType[keyof typeof mutationOperationSubTreeType]
	entityId: EntityId
}
