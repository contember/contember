import React, { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DragOverlay } from '@dnd-kit/core'
import { AccessorTree, Entity, useAccessorTreeState } from '@contember/react-binding'
import { BoardActiveItemContext, useBoardActiveItem } from '../contexts.js'

export const BoardSortableItemDragOverlay = ({ children }: {
	children: ReactNode
}) => {
	const activeItem = useBoardActiveItem()
	const accessorTreeState = useAccessorTreeState()
	if (!activeItem) {
		return null
	}
	return (
		createPortal(
			<DragOverlay>
				<BoardActiveItemContext.Provider value={activeItem}>
					<AccessorTree state={accessorTreeState}>
						<Entity accessor={activeItem.value}>
							{children}
						</Entity>
					</AccessorTree>
				</BoardActiveItemContext.Provider>
			</DragOverlay>,
			document.body,
		)
	)
}
