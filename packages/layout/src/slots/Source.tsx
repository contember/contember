import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { usePortalsRegistryContext } from './contexts'
import { SourcePortalProps } from './types'

export const Source = memo<SourcePortalProps>(({ name, children }) => {
	const { getTarget, registerSlotSource, unregisterSlotSource } = usePortalsRegistryContext()

	const instanceId = useMemo(() => Math.random().toString(36).substring(2, 9), [])
	const instanceIdRef = useRef(instanceId)
	instanceIdRef.current = instanceId

	const delayedWarning = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	useLayoutEffect(() => {
		if (registerSlotSource && unregisterSlotSource) {
			const id = instanceIdRef.current
			registerSlotSource(id, name)

			return () => {
				unregisterSlotSource(id, name)
				clearTimeout(delayedWarning.current)
			}
		}
	}, [name, registerSlotSource, unregisterSlotSource])

	// There is a parent Slot context to provide a targets for slots...
	if (getTarget) {
		const target = getTarget?.(name)

		// ...and in case we have target we render children into it...
		if (target) {
			if (delayedWarning.current) {
				clearTimeout(delayedWarning.current)
			}

			return createPortal(children, target)
		} else {
			// ...but if there is no target, it means that the slot is either
			// not being rendered in the DOM at all or it is being temporarily
			// missing because of the re-rendering of the DOM tree but we cannot
			// tell which one is the case.
			//
			// One way to avoid this is to keep list of all slots supported
			// by the layout in the userland and check if the slot is in the list.
			//
			// Also in development mode we can at least warn about this, but
			// it can cause false positives in case of the re-rendering therefore
			// we delay the warning a bit.
			if (import.meta.env.DEV) {
				if (delayedWarning.current) {
					clearTimeout(delayedWarning.current)
				}

				delayedWarning.current = setTimeout(() => {
					console.warn(`Page "${window.location.href}" tried to create a portal to a Slot named "${name}" `
						+ `but there seem to be no target for it in the layout. However, this might be you intention `
						+ `or a temporary state in between the renders. Make sure you have added a target for it `
						+ `in your layout so it can be rendered next time.`)
				}, 1000)
			}

			return null
		}
	} else {
		return <>{children}</>
	}
})
Source.displayName = 'Interface.Slots.Source'
