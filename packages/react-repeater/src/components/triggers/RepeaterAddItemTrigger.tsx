import React, { ReactNode, useMemo } from 'react'
import { RepeaterAddItemIndex } from '../../types/RepeaterMethods'
import { useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'

export const RepeaterAddItemTrigger = ({ children, index }: { children: ReactNode, index: RepeaterAddItemIndex }) => {
	const { addItem } = useRepeaterMethods()
	const onClick = useMemo(() => () => addItem?.(index), [addItem, index])

	return <Slot onClick={onClick}>{children}</Slot>
}
