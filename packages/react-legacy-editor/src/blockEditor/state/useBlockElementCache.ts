import {
	EntityAccessor,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntityBeforeUpdate,
} from '@contember/react-binding'
import { useCallback, useState } from 'react'
import { Editor, Element as SlateElement } from 'slate'

export type BlockElementCache = WeakMap<EntityAccessor, SlateElement>

export const useBlockElementCache = ({ editor, blockList, sortableBy, contentField }: {
	editor: Editor,
	blockList: SugaredRelativeEntityList,
	sortableBy: SugaredFieldProps['field']
	contentField: SugaredFieldProps['field']
}): BlockElementCache => {

	const [blockElementCache] = useState(() => new WeakMap<EntityAccessor, SlateElement>())
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const desugaredBlockContentField = useDesugaredRelativeSingleField(contentField)

	useEntityBeforeUpdate(
		useCallback(
			getAccessor => {
				const hasPendingOperations = !!editor.operations.length // See the explanation in overrideSlateOnChange
				if (hasPendingOperations) {
					return
				}
				for (const blockEntity of getAccessor().getEntityList(blockList)) {
					const cachedElement = blockElementCache.get(blockEntity)

					if (cachedElement !== undefined) {
						continue
					}
					const blockIndex =
						blockEntity.getRelativeSingleField<number>(desugaredSortableByField).value!
					if (editor.children.length < blockIndex) {
						continue
					}

					// Whenever something changes within the block, we get a new instance of the blockEntity accessor.
					// Not all such changes are due to the editor though. Some could be just something within the reference.
					// In those cases, we would get a cache miss and deserialize the block node again, thereby losing its
					// referential equality. That, in turn, would cause Slate to re-mount the element during render which
					// would completely ruin the UX. Thus we want to keep the old node if possible. We check whether it
					// would be equivalent, and if so, just use the old one. That way Slate never gets a new node and no
					// remounting ever takes place.
					const previousNode = editor.children[blockIndex]
					const contentField = blockEntity.getRelativeSingleField<string>(desugaredBlockContentField)
					const currentNode = editor.deserializeNodes(
						contentField.value!,
						`BlockEditor: The 'contentField' of a block contains invalid data.`,
					)[0]
					if (SlateElement.isElement(previousNode) && JSON.stringify(previousNode) === JSON.stringify(currentNode)) {
						blockElementCache.set(blockEntity, previousNode)
					}
				}
			},
			[blockElementCache, blockList, desugaredBlockContentField, desugaredSortableByField, editor],
		),
	)
	return blockElementCache
}
