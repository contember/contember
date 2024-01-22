import React, { ReactNode, useMemo } from 'react'
import { useRepeaterMethods } from '../../internal/contexts'
import { Slot } from '@radix-ui/react-slot'
import { useEntity } from '@contember/react-binding'

export const RepeaterRemoveItemTrigger = ({ children }: { children: ReactNode }) => {
	const { removeItem } = useRepeaterMethods()
	const entity = useEntity()
	const onClick = useMemo(() => () => removeItem?.(entity), [removeItem, entity])

	return <Slot onClick={onClick}>{children}</Slot>
}
