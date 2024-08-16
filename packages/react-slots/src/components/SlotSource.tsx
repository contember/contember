import { memo, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSlotTargetElement } from '../hooks'

export type SlotSourceProps = {
	children: ReactNode
	name: string
}

/**
 * @group Layout
 */
export const SlotSource = memo<SlotSourceProps>(({ name, children }) => {
	const el = useSlotTargetElement(name)
	if (el) {
		return createPortal(children, el)
	} else if (el === undefined) {
		return null
	}
	return <>{children}</>
})
SlotSource.displayName = 'Layout.Slots.Source'
