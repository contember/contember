import React, { forwardRef, ReactElement, useCallback } from 'react'
import { useSelectHandleSelect } from '../contexts'
import { Slot } from '@radix-ui/react-slot'
import { useEntity } from '@contember/react-binding'

export type SelectItemTriggerProps = {
	children: ReactElement
	action?: 'select' | 'unselect' | 'toggle'
}

export const SelectItemTrigger = forwardRef<HTMLElement, SelectItemTriggerProps>(({ action, ...props }: SelectItemTriggerProps, ref) => {
	const handleSelect = useSelectHandleSelect()
	const entity = useEntity()
	const onClick = useCallback(() => {
		handleSelect?.(entity, action)
	}, [action, entity, handleSelect])

	return <Slot onClick={onClick} {...props} ref={ref} />
})
