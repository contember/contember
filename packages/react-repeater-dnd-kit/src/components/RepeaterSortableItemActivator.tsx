import React, { forwardRef, ReactNode } from 'react'
import { useRepeaterSortableItem } from '../contexts'
import { Slot } from '@radix-ui/react-slot'
import { useComposeRef } from '@contember/react-utils'

export const RepeaterSortableItemActivator = forwardRef<HTMLElement, {
	children: ReactNode
}>((props, ref) => {
	const { setActivatorNodeRef, listeners } = useRepeaterSortableItem()
	return <Slot ref={useComposeRef(ref, setActivatorNodeRef)} {...listeners} {...props} />
})
