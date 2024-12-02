import { DragOverlay } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { Portal } from '@radix-ui/react-portal'
import { GripVerticalIcon } from 'lucide-react'
import React, { ReactNode } from 'react'
import { Element } from 'slate'
import { DropIndicator } from '../ui/sortable'
import { cn, uic } from '../utils'

export const BlockEditorHandle = uic('span', {
	baseClass: 'absolute top-1/2 -left-3 h-6 w-6 flex justify-end items-center opacity-10 hover:opacity-100 transition-opacity -translate-y-1/2 cursor-grab',
	beforeChildren: <GripVerticalIcon size={16} />,
})

export const SortableBlock = ({ children, element }: { children: ReactNode; element: Element }) => {
	const sortable = useSortable({
		id: element.key as string,
	})
	const isOver = sortable.isOver
	const activeSortable = sortable.active?.data.current?.sortable
	const isAfter = (sortable.data?.sortable.index ?? 0) > activeSortable?.index
	const isActive = sortable.active?.id === element.key
	const contentRef = React.useRef<HTMLDivElement>(null)

	return (<>
		<div className="relative group/sortable-block">
			<div className="relative">
				{isOver && !isAfter ? <DropIndicator placement="top" /> : null}
			</div>
			<div className={cn('my-6 px-6 group-first/sortable-block:mt-0 group-last:mb-0', { 'opacity-60': isActive })} ref={sortable.setNodeRef}>
				<BlockEditorHandle ref={sortable.setActivatorNodeRef} {...sortable.listeners} />
				<div ref={contentRef}>
					{children}
				</div>
			</div>
			<div className="relative">
				{isOver && isAfter ? <DropIndicator placement="bottom" /> : null}
			</div>
		</div>
		{isActive && contentRef.current && <Portal>
			<DragOverlay>
				<div className="opacity-80 flex">
					<div
						className="p-4 bg-white bg-opacity-80 backdrop-blur-sm"
						// deliberately using innerHTML to avoid firing React events
						dangerouslySetInnerHTML={{ __html: contentRef.current.innerHTML }}
					/>
				</div>
			</DragOverlay>
		</Portal>}
	</>)
}

