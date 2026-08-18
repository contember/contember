import { Editor, PathRef } from 'slate'
import { useCallback, useState } from 'react'
import {
	EntityId,
	sortEntities,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useDesugaredRelativeEntityList,
	useDesugaredRelativeSingleField,
	useEntityPersistSuccess,
} from '@contember/react-binding'

export type BlockElementPathRefs = Map<EntityId, PathRef>
export const useBlockElementPathRefs = ({ editor, blockList, sortableBy }: {
	editor: Editor
	blockList: SugaredRelativeEntityList
	sortableBy: SugaredFieldProps['field']
}): BlockElementPathRefs => {
	const [blockElementPathRefs] = useState(() => new Map<EntityId, PathRef>())
	const desugaredBlockList = useDesugaredRelativeEntityList(blockList)
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	// TODO this isn't particularly great. We should probably react to id changes more directly.
	useEntityPersistSuccess(
		useCallback(
			getEntity => {
				for (const ref of blockElementPathRefs.values()) {
					ref.unref()
				}
				blockElementPathRefs.clear()
				// The mapping is positional, so it has to follow the sortable field rather than the order in which
				// the entities happen to sit in the list — newly created blocks are appended at its end no matter
				// where they belong in the editor. Getting this wrong points the refs at the wrong blocks and the
				// next refresh then rewrites their content and order.
				const blocks = sortEntities(Array.from(getEntity().getEntityList(desugaredBlockList)), desugaredSortableByField)
				blocks.forEach((topLevelBlock, blockIndex) => {
					blockElementPathRefs.set(topLevelBlock.id, Editor.pathRef(editor, [blockIndex], { affinity: 'backward' }))
				})
			},
			[blockElementPathRefs, desugaredBlockList, desugaredSortableByField, editor],
		),
	)
	return blockElementPathRefs
}
