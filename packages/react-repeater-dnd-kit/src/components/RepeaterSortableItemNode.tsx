import React, { ReactElement } from 'react'
import { useRepeaterSortableItem } from '../contexts'
import { Slot } from '@radix-ui/react-slot'

/**
 * Slot for the repeater item node, which is the element that is being dragged.
 */
export const RepeaterSortableItemNode = ({ children }: {
	children: ReactElement
}) => {
	const { setNodeRef } = useRepeaterSortableItem()
	return <Slot ref={setNodeRef}>{children}</Slot>
}
