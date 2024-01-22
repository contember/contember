import React, { ReactNode } from 'react'
import { useRepeaterSortableItem } from '../internal/contexts'
import { Slot } from '@radix-ui/react-slot'

export const RepeaterSortableItemNode = ({ children }: {
	children: ReactNode
}) => {
	const { setNodeRef } = useRepeaterSortableItem()
	return <Slot ref={setNodeRef}>{children}</Slot>
}
