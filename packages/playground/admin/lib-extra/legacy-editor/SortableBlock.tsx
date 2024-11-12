import { SortedBlocksContext } from '@contember/react-slate-editor-legacy'
import React, { ReactNode, useContext } from 'react'
import { Element } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { useSortable } from '@dnd-kit/sortable'
import { RepeaterCurrentEntityContext, RepeaterSortableItemActivator, RepeaterSortableItemContext, RepeaterSortableItemNode } from '@contember/react-repeater-dnd-kit'
import { Entity } from '@contember/interface'
import { GripVerticalIcon } from 'lucide-react'
import { RepeaterDropIndicator } from '@app/lib/repeater'
import { uic } from '@app/lib/utils'

export const BlockeEditorHandle = uic('span', {
	baseClass: 'absolute top-1/2 -left-3 h-6 w-6 flex justify-end items-center opacity-10 hover:opacity-100 transition-opacity -translate-y-1/2 cursor-grab',
	beforeChildren: <GripVerticalIcon size={16} />,
})

export const SortableBlock = ({ children, element }: { children: ReactNode; element: Element }) => {
	const editor = useSlateStatic()
	// intentionally passing through the context, so it redraws on order change
	const sortedBlocks = useContext(SortedBlocksContext)
	// intentionally finding path again and not passing from renderElement, because it might have changed
	const [index] = ReactEditor.findPath(editor, element)
	const entity = sortedBlocks[index]
	const sortable = useSortable({
		id: entity?.id,
	})
	if (!entity) {
		return <>
			<div className="p-4">
				<BlockeEditorHandle />
				{children}
			</div>
		</>
	}

	return (
		<Entity key={entity.key} accessor={entity}>
			<RepeaterCurrentEntityContext.Provider value={entity}>
				<RepeaterSortableItemContext.Provider value={sortable}>
					<div className="relative">
						<RepeaterDropIndicator position={'before'} />
						<RepeaterSortableItemNode>
							<div className="p-4">
								<RepeaterSortableItemActivator>
									<BlockeEditorHandle />
								</RepeaterSortableItemActivator>
								{children}
							</div>
						</RepeaterSortableItemNode>
						<RepeaterDropIndicator position={'after'} />
					</div>
				</RepeaterSortableItemContext.Provider>
			</RepeaterCurrentEntityContext.Provider>
		</Entity>
	)
}

