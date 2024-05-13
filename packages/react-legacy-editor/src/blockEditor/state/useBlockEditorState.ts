import { useBlockElementCache } from './useBlockElementCache'
import { Descendant, Editor } from 'slate'
import { EntityAccessor, EntityId, sortEntities, SugaredFieldProps, SugaredRelativeEntityList, useDesugaredRelativeSingleField, useEntityList } from '@contember/react-binding'
import { useBlockElementPathRefs } from './useBlockElementPathRefs'
import { useBlockEditorOnChange } from './useBlockEditorOnChange'
import { MutableRefObject, useEffect, useMemo, useRef } from 'react'
import { useBlockEditorSlateNodes } from '../useBlockEditorSlateNodes'
import { useRefreshBlocks } from './useRefreshBlocks'

export interface useBlockEditorStateResult {
	onChange: () => void
	nodes: Descendant[]
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
	refreshBlocks: () => void
}

export const useBlockEditorState = ({ editor, blockList, sortableBy, contentField, monolithicReferencesMode, referencesField }: {
	editor: Editor,
	blockList: SugaredRelativeEntityList,
	sortableBy: SugaredFieldProps['field']
	contentField: SugaredFieldProps['field']
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
}): useBlockEditorStateResult => {
	const entityList = useEntityList(blockList)
	const desugaredSortableByField = useDesugaredRelativeSingleField(sortableBy)
	const trashFakeBlockId = useRef<EntityId>()
	const sortedBlocks = useMemo(() => {
		return sortEntities(
			Array.from(entityList).filter(it => it.id !== trashFakeBlockId.current),
			desugaredSortableByField,
		)
	}, [desugaredSortableByField, entityList])
	const sortedBlocksRef = useRef(sortedBlocks)
	useEffect(() => {
		sortedBlocksRef.current = sortedBlocks
	}, [sortedBlocks])
	const blockElementCache = useBlockElementCache({ editor, blockList, sortableBy, contentField })
	const blockElementPathRefs = useBlockElementPathRefs({ editor, blockList })

	const refreshBlocks = useRefreshBlocks({ editor, sortableBy, contentField, blockList, blockElementCache, blockElementPathRefs, referencesField, monolithicReferencesMode, sortedBlocksRef, trashFakeBlockId })
	const onChange = useBlockEditorOnChange({ editor, blockList, contentField, blockElementCache, sortedBlocksRef, refreshBlocks })
	const nodes = useBlockEditorSlateNodes({ editor, blockElementCache, blockElementPathRefs, blockContentField: contentField, topLevelBlocks: sortedBlocks })

	return { onChange, nodes, sortedBlocksRef, refreshBlocks }
}
