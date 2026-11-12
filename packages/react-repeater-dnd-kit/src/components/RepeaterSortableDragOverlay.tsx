import React, { ReactNode } from 'react'
import { RepeaterSortableItemContext, useRepeaterActiveEntity } from '../contexts.js'
import { createPortal } from 'react-dom'
import { DragOverlay } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { AccessorTree, Entity, EntityAccessor, useAccessorTreeState } from '@contember/react-binding'
import { RepeaterCurrentEntityContext } from '@contember/react-repeater'

/**
 * Component for rendering the repeater item being dragged.
 */
export const RepeaterSortableDragOverlay = ({ children }: {
	children: ReactNode
}) => {
	const activeItem = useRepeaterActiveEntity()
	const accessorTreeState = useAccessorTreeState()
	if (!activeItem) {
		return null
	}
	return (
		createPortal(
			<DragOverlay>
				<AccessorTree state={accessorTreeState}>
					<Entity accessor={activeItem}>
						<RepeaterCurrentEntityContext.Provider value={activeItem}>
							<RepeaterSortableDragOverlayItemContext activeItem={activeItem}>
								{children}
							</RepeaterSortableDragOverlayItemContext>
						</RepeaterCurrentEntityContext.Provider>
					</Entity>
				</AccessorTree>
			</DragOverlay>,
			document.body,
		)
	)
}

const RepeaterSortableDragOverlayItemContext = ({ activeItem, children }: {
	activeItem: EntityAccessor
	children: ReactNode
}) => {
	const sortable = useSortable({
		id: activeItem.id,
	})
	return (
		<RepeaterSortableItemContext.Provider value={sortable}>
			{children}
		</RepeaterSortableItemContext.Provider>
	)
}
