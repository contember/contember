import { EntityId, PlaceholderName, TreeRootId } from '../../treeParameters'
import { MutationOperationSubTreeType } from './MutationOperationSubTreeType'
import { MutationOperationType } from './MutationOperationType'

export interface TopLevelMutationOperation {
	treeRootId: TreeRootId | undefined
	subTreePlaceholder: PlaceholderName
	type: MutationOperationType
	subTreeType: MutationOperationSubTreeType
	entityId: EntityId
}
