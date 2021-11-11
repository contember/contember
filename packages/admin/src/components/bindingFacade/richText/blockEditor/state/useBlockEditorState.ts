import { useBlockElementCache } from './useBlockElementCache'
import { Editor } from 'slate'
import {
	EntityAccessor,
	SugaredFieldProps,
	SugaredRelativeEntityList,
	useEntityList,
	useSortedEntities,
} from '@contember/binding'
import { useBlockElementPathRefs } from './useBlockElementPathRefs'
import { useBlockEditorOnChange } from './useBlockEditorOnChange'
import { useRef } from 'react'
import { useBlockEditorSlateNodes } from '../useBlockEditorSlateNodes'

export type SortedBlockRef = React.MutableRefObject<EntityAccessor[]>
export const useBlockEditorState = ({ editor, blockList, sortableBy, contentField, monolithicReferencesMode, referencesField }: {
	editor: Editor,
	blockList: SugaredRelativeEntityList,
	sortableBy: SugaredFieldProps['field']
	contentField: SugaredFieldProps['field']
	referencesField?: SugaredRelativeEntityList | string
	monolithicReferencesMode?: boolean
}) => {
	const { entities: sortedBlocks } = useSortedEntities(useEntityList(blockList), sortableBy)
	const sortedBlocksRef = useRef(sortedBlocks)
	sortedBlocksRef.current = sortedBlocks
	const blockElementCache = useBlockElementCache({ editor, blockList, sortableBy, contentField })
	const blockElementPathRefs = useBlockElementPathRefs({ editor, blockList })
	const onChange = useBlockEditorOnChange({ editor, blockList, sortableBy, contentField, blockElementCache, blockElementPathRefs, sortedBlocksRef, monolithicReferencesMode, referencesField })
	const nodes = useBlockEditorSlateNodes({ editor, blockElementCache, blockElementPathRefs, blockContentField: contentField, topLevelBlocks: sortedBlocks })

	return { onChange, nodes, sortedBlocksRef, blockElementCache, blockElementPathRefs, sortedBlocks }
}
