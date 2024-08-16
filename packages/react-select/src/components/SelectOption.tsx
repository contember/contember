import React, { forwardRef, ReactNode } from 'react'
import { useSelectIsSelected } from '../contexts'
import { Slot } from '@radix-ui/react-slot'
import { useEntity } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'

export type SelectOptionProps = {
	children: ReactNode
	action?: 'select' | 'unselect' | 'toggle'
}

export const SelectOption = forwardRef<HTMLElement, SelectOptionProps>(({ action, ...props }, ref) => {
	const isSelected = useSelectIsSelected()
	const entity = useEntity()
	return (
		<Slot
			ref={ref}
			data-selected={dataAttribute(isSelected?.(entity))}
			{...props}
		/>
	)
})
