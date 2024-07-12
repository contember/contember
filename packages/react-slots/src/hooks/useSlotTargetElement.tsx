import { usePortalsRegistryContext } from '../internal/contexts'
import { useEffect, useLayoutEffect, useMemo } from 'react'
import { useId } from '@contember/react-utils'

const useSlotTargetElementProd = (name: string): HTMLElement | null | undefined => {
	const { getTarget, registerSlotSource } = usePortalsRegistryContext()
	const instanceId = useId()

	useLayoutEffect(() => {
		return registerSlotSource?.(instanceId, name)
	}, [instanceId, name, registerSlotSource])

	return useMemo(() => {
		if (!getTarget) {
			return null
		}
		return getTarget(name)
	}, [getTarget, name])
}
const useSlotTargetElementDev = (name: string): HTMLElement | null | undefined => {
	const target = useSlotTargetElementProd(name)
	useEffect(() => {
		// if there is no target, it means that the slot is either
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
		if (target === undefined) {
			const handle = setTimeout(() => {
				console.warn(`Page "${window.location.href}" tried to create a portal to a Slot named "${name}" `
					+ `but there seem to be no target for it in the layout. However, this might be you intention `
					+ `or a temporary state in between the renders. Make sure you have added a target for it `
					+ `in your layout so it can be rendered next time.`)
			}, 1000)
			return () => {
				clearTimeout(handle)
			}
		}
	}, [name, target])

	return target
}

/**
 * Returns the target element for the given slot name.
 * If there is no slots context, it returns `null`.
 * If the target is not present in the layout, it returns `undefined`.
 */
export const useSlotTargetElement = import.meta.env.DEV ? useSlotTargetElementDev : useSlotTargetElementProd
