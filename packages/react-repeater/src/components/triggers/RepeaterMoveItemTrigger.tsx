import React, { ReactNode, useMemo } from 'react'
import { RepeaterMoveItemIndex } from '../../types/RepeaterMethods'
import { useRepeaterMethods } from '../../internal/contexts'
import { Slot } from '@radix-ui/react-slot'
import { useEntity } from '@contember/react-binding'

export const RepeaterMoveItemTrigger = ({ children, index }: { children: ReactNode, index: RepeaterMoveItemIndex }) => {
	const { moveItem } = useRepeaterMethods()
	const entity = useEntity()
	const onClick = useMemo(() => () => moveItem?.(entity, index), [moveItem, entity, index])

	return <Slot onClick={onClick}>{children}</Slot>
}
