import React, { ReactNode } from 'react'
import { useBoardSortableNode } from '../contexts.js'
import { Slot } from '@radix-ui/react-slot'

export const BoardSortableActivator = ({ children }: {
	children: ReactNode
}) => {
	const { setActivatorNodeRef, listeners } = useBoardSortableNode()
	return <Slot ref={setActivatorNodeRef} {...listeners}>{children}</Slot>
}
