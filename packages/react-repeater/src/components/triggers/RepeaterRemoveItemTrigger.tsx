import React, { ReactNode, useMemo } from 'react'
import { useRepeaterCurrentEntity, useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'

export const RepeaterRemoveItemTrigger = ({ children }: { children: ReactNode }) => {
	const { removeItem } = useRepeaterMethods()
	const entity = useRepeaterCurrentEntity()
	const onClick = useMemo(() => () => removeItem?.(entity), [removeItem, entity])

	return <Slot onClick={onClick}>{children}</Slot>
}
