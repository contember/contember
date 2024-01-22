import React, { ReactNode } from 'react'
import { useRepeaterSortableItem } from '../internal/contexts'
import { Slot } from '@radix-ui/react-slot'

export const RepeaterSortableItemActivator = ({ children }: {
	children: ReactNode
}) => {
	const { setActivatorNodeRef, listeners } = useRepeaterSortableItem()
	return <Slot ref={setActivatorNodeRef} {...listeners}>{children}</Slot>
}
