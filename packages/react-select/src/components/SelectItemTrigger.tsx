import React, { forwardRef, ReactElement, useCallback } from 'react'
import { useSelectHandleSelect } from '../contexts'
import { Slot } from '@radix-ui/react-slot'
import { useEntity } from '@contember/react-binding'

export type SelectItemTriggerProps = {
	children: ReactElement
	action?: 'select' | 'unselect' | 'toggle'
	onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

export const SelectItemTrigger = forwardRef<HTMLElement, SelectItemTriggerProps>(({ action, ...props }: SelectItemTriggerProps, ref) => {
	const handleSelect = useSelectHandleSelect()
	const entity = useEntity()
	const onClickProp = props.onClick
	const onClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
		handleSelect?.(entity, action)
		onClickProp?.(e)
	}, [action, entity, handleSelect, onClickProp])
	return <Slot {...props} onClick={onClick}  ref={ref} />
})
