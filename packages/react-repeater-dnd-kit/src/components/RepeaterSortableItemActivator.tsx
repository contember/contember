import React, { forwardRef, ReactElement, ReactNode } from 'react'
import { useRepeaterSortableItem } from '../contexts'
import { Slot } from '@radix-ui/react-slot'
import { useComposeRef } from '@contember/react-utils'

/**
 * Slot for the repeater item activator, which is the element that triggers the drag and drop interaction (e.g. a handle).
 */
export const RepeaterSortableItemActivator = forwardRef<HTMLElement, {
	children: ReactElement
}>((props, ref) => {
	const { setActivatorNodeRef, listeners } = useRepeaterSortableItem()
	return <Slot ref={useComposeRef(ref, setActivatorNodeRef)} {...listeners} {...props} />
})
