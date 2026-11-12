import React, { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { DragOverlay } from '@dnd-kit/core'
import { AccessorTree, Entity, EntityAccessor, isEntityAccessor, useAccessorTreeState } from '@contember/react-binding'
import { useBoardActiveColumn } from '../contexts.js'
import { BoardCurrentColumnContext } from '@contember/react-board'

export const BoardSortableColumnDragOverlay = ({ children }: {
	children: ReactNode
}) => {
	const activeItem = useBoardActiveColumn()
	const accessorTreeState = useAccessorTreeState()
	if (!activeItem) {
		return null
	}
	return (
		createPortal(
			<DragOverlay>
				<BoardCurrentColumnContext.Provider value={activeItem}>
					<AccessorTree state={accessorTreeState}>
						{isEntityAccessor(activeItem.value)
							? (
								<Entity accessor={activeItem.value}>
									{children}
								</Entity>
							)
							: children}
					</AccessorTree>
				</BoardCurrentColumnContext.Provider>
			</DragOverlay>,
			document.body,
		)
	)
}
