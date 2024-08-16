import React, { ReactNode } from 'react'
import { useBoardSortableNode } from '../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

export const BoardSortableNode = ({ children }: {
	children: ReactNode
}) => {
	const { setNodeRef, isOver, isDragging, active } = useBoardSortableNode()
	return (
		<Slot
			ref={setNodeRef}
			data-sortable-over={dataAttribute(isOver ? active?.data.current?.type : undefined)}
			data-sortable-dragging={dataAttribute(isDragging)}
		>
			{children}
		</Slot>
	)
}
