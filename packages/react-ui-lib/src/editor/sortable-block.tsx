import { DragOverlay } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { Portal } from '@radix-ui/react-portal'
import { GripVerticalIcon } from 'lucide-react'
import { ReactNode, useRef } from 'react'
import { Element } from 'slate'
import { DropIndicator } from '../ui/sortable'
import { uic } from '../utils'

/**
 * BlockEditorHandle component - Drag handle for sortable blocks
 *
 * #### Example
 * ```tsx
 * <BlockEditorHandle />
 * ```
 */
export const BlockEditorHandle = uic('span', {
	baseClass: 'absolute top-1/2 -left-3 h-6 w-6 flex justify-end items-center opacity-10 hover:opacity-100 transition-opacity -translate-y-1/2 cursor-grab',
	beforeChildren: <GripVerticalIcon size={16} />,
})

export type SortableBlockProps = {
	/** Block content to render */
	children: ReactNode
	/** Slate Element object containing block data (requires key) */
	element: Element
}

/**
 * SortableBlock component - Drag-and-drop enabled block container for Slate editor
 *
 * #### Purpose
 * Implements sortable functionality for editor blocks with visual feedback and overlay
 *
 * #### Example: Basic usage
 * ```tsx
 * <SortableBlock element={slateElement}>
 *   <BlockContent />
 * </SortableBlock>
 * ```
 *
 * #### Example: Used within a BlockEditor
 * ```tsx
 * <BlockEditor
 *   plugins={[
 *     withSortable({
 *       render: SortableBlock,
 *     }),
 *   ]}
 * />
 */
export const SortableBlock = ({ children, element }: SortableBlockProps) => {
	const sortable = useSortable({
		id: element.key as string,
	})
	const isOver = sortable.isOver
	const activeSortable = sortable.active?.data.current?.sortable
	const isAfter = (sortable.data?.sortable.index ?? 0) > activeSortable?.index
	const isActive = sortable.active?.id === element.key
	const contentRef = useRef<HTMLDivElement>(null)

	return (<>
		<div className="relative">
			<div className={'relative'}>
				{isOver && !isAfter ? <DropIndicator placement={'top'} /> : null}
			</div>
			<div className={'p-6 ' + (isActive ? 'opacity-60' : '')} ref={sortable.setNodeRef}>
				<BlockEditorHandle ref={sortable.setActivatorNodeRef} {...sortable.listeners} />
				<div ref={contentRef}>
					{children}
				</div>
			</div>
			<div className={'relative'}>
				{isOver && isAfter ? <DropIndicator placement={'bottom'} /> : null}
			</div>
		</div>
		{isActive && contentRef.current && <Portal>
			<DragOverlay>
				<div className="opacity-80 flex">
					<div className="p-4 bg-background/80 backdrop-blur-xs"
						// deliberately using innerHTML to avoid firing React events
						 dangerouslySetInnerHTML={{ __html: contentRef.current.innerHTML }} />
				</div>
			</DragOverlay>
		</Portal>}
	</>)
}

