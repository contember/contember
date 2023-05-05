import { memo, ReactNode, useLayoutEffect, useMemo, useRef } from 'react'
import { useRenderToSlotPortalContext } from './Contexts'

export type LayoutSlotProps = { children: ReactNode, target: string }

export const LayoutSlotPortal = memo<LayoutSlotProps>(({ target, children }) => {
	const {
		createLayoutSlotPortal,
		registerLayoutSlotPortal,
		unregisterLayoutSlotPortal,
	} = useRenderToSlotPortalContext()

	const instanceId = useMemo(() => Math.random().toString(36).substring(2, 9), [])
	const instanceIdRef = useRef(instanceId)
	instanceIdRef.current = instanceId

	useLayoutEffect(() => {
		const id = instanceIdRef.current
		registerLayoutSlotPortal(id, target)

		return () => unregisterLayoutSlotPortal(id, target)
	}, [target, registerLayoutSlotPortal, unregisterLayoutSlotPortal])

	return <>
		{createLayoutSlotPortal(target, children)}
	</>
})
LayoutSlotPortal.displayName = 'SlotPortal'
