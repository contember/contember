import type { EntityId, PlaceholderName, TreeRootId } from '../../treeParameters'
import type { MutationOperationSubTreeType } from './MutationOperationSubTreeType'
import type { MutationOperationType } from './MutationOperationType'

export interface TopLevelMutationOperation {
	treeRootId: TreeRootId | undefined
	subTreePlaceholder: PlaceholderName
	type: MutationOperationType
	subTreeType: MutationOperationSubTreeType
	entityId: EntityId
}
