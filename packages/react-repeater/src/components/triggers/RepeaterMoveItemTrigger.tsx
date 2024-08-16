import React, { ReactNode, useMemo } from 'react'
import { RepeaterMoveItemIndex } from '../../types/RepeaterMethods'
import { useRepeaterCurrentEntity, useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'

export const RepeaterMoveItemTrigger = ({ children, index }: { children: ReactNode; index: RepeaterMoveItemIndex }) => {
	const { moveItem } = useRepeaterMethods()
	const entity = useRepeaterCurrentEntity()
	const onClick = useMemo(() => () => moveItem?.(entity, index), [moveItem, entity, index])

	return <Slot onClick={onClick}>{children}</Slot>
}
