import React, { ReactNode, useMemo } from 'react'
import { RepeaterAddItemIndex } from '../../types/RepeaterMethods'
import { useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { EntityAccessor } from '@contember/react-binding'

export type RepeaterAddItemTriggerProps = {
	children: ReactNode
	index?: RepeaterAddItemIndex
	preprocess?: EntityAccessor.BatchUpdatesHandler
}
export const RepeaterAddItemTrigger = ({ children, index, preprocess }: RepeaterAddItemTriggerProps) => {
	const { addItem } = useRepeaterMethods()
	const onClick = useMemo(() => () => addItem?.(index, preprocess), [addItem, index, preprocess])

	return <Slot onClick={onClick}>{children}</Slot>
}
