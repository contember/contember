import React, { ReactNode } from 'react'
import { Portal } from '@radix-ui/react-portal'
import { DragOverlay } from '@dnd-kit/core'
import { AccessorTree, Entity, EntityAccessor, isEntityAccessor, useAccessorTreeState } from '@contember/react-binding'
import { useBoardActiveColumn } from '../contexts'
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
		<Portal>
			<DragOverlay>
				<BoardCurrentColumnContext.Provider value={activeItem}>
					<AccessorTree state={accessorTreeState}>
						{isEntityAccessor(activeItem.value) ?
							<Entity accessor={activeItem.value}>
								{children}
							</Entity>
							: children
						}
					</AccessorTree>
				</BoardCurrentColumnContext.Provider>
			</DragOverlay>
		</Portal>
	)
}
