import { Slot } from '@radix-ui/react-slot'
import { useBlockRepeaterConfig } from '../contexts'
import React, { ReactElement, useMemo } from 'react'
import { EntityAccessor } from '@contember/react-binding'
import { RepeaterAddItemIndex, useRepeaterMethods } from '@contember/react-repeater'

export interface BlockRepeaterAddItemTriggerProps {
	children: ReactElement
	type: string
	index?: RepeaterAddItemIndex
	preprocess?: EntityAccessor.BatchUpdatesHandler
}

export const BlockRepeaterAddItemTrigger = ({ preprocess, index, type, ...props }: BlockRepeaterAddItemTriggerProps) => {
	const { discriminatedBy } = useBlockRepeaterConfig()

	const { addItem } = useRepeaterMethods()
	const onClick = useMemo(() => () => addItem?.(index, it => {
		it().getField(discriminatedBy).updateValue(type)
	}), [addItem, discriminatedBy, index, type])

	return <Slot onClick={onClick} {...props} />
}
