import { SortedBlocksContext } from '@contember/react-legacy-editor'
import React, { ReactNode, useContext } from 'react'
import { Element } from 'slate'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { useSortable } from '@dnd-kit/sortable'
import { RepeaterCurrentEntityContext, RepeaterSortableItemActivator, RepeaterSortableItemContext, RepeaterSortableItemNode } from '@contember/react-repeater-dnd-kit'
import { Entity } from '@contember/interface'
import { RepeaterDropIndicator } from '../../lib/components/repeater'
import { uic } from '../../lib/utils/uic'
import { GripVerticalIcon } from 'lucide-react'

export const BlockeEditorHandle = uic('button', {
	baseClass: 'absolute top-1/2 -left-3 h-6 w-6 flex justify-end align-center opacity-10 hover:opacity-100 transition-opacity -translate-y-1/2',
	beforeChildren: <GripVerticalIcon size={16} />,
})

export const SortableBlock = ({ children, element }: { children: ReactNode, element: Element }) => {
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
		return null
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

