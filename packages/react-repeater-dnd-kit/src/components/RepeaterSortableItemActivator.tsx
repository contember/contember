import React, { forwardRef, ReactNode } from 'react'
import { useRepeaterSortableItem } from '../internal/contexts'
import { Slot } from '@radix-ui/react-slot'
import { composeRefs } from '@radix-ui/react-compose-refs'

export const RepeaterSortableItemActivator = forwardRef<HTMLElement, {
	children: ReactNode
}>((props, ref) => {
	const { setActivatorNodeRef, listeners } = useRepeaterSortableItem()
	return <Slot ref={composeRefs(ref, setActivatorNodeRef)} {...listeners} {...props} />
})
