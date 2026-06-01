import React, { ReactNode } from 'react'
import { RepeaterSortableItemContext, useRepeaterActiveEntity } from '../contexts'
import { Portal } from '@radix-ui/react-portal'
import { DragOverlay } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { AccessorTree, EntityAccessor, Entity, useAccessorTreeState } from '@contember/react-binding'
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
		<Portal>
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
			</DragOverlay>
		</Portal>
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
