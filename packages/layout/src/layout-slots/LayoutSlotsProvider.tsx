import { useScopedConsoleRef } from '@contember/react-utils'
import { ReactNode, RefObject, memo, useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LayoutSlotRegistryContext, LayoutSlotRegistryContextType, LayoutSlotsRegistry, RenderToSlotPortalContext } from './Contexts'

export const LayoutSlotsProvider = memo<{ children: ReactNode }>(({
	children,
}) => {
	const scopedConsoleRef = useScopedConsoleRef(`LayoutSlotsProvider`)

	const [slotsMap, setSlotsMap] = useState<LayoutSlotsRegistry>(new Map)
	const [activeSlotsMap, setActiveSlotsMap] = useState<Map<string, string>>(new Map)
	const activeSlots: Set<string> = useMemo(() => new Set(activeSlotsMap.values()), [activeSlotsMap])

	const activeSlotsMapRef = useRef(activeSlotsMap); activeSlotsMapRef.current = activeSlotsMap

	const registerLayoutSlot = useCallback((name: string, ref: RefObject<HTMLElement>) => {
		setSlotsMap(slots => new Map([...slots, [name, ref]]))
	}, [])

	const unregisterLayoutSlot = useCallback((name: string) => {
		setSlotsMap(slots => {
			slots.delete(name)
			return new Map([...slots])
		})
	}, [])

	const layoutSlotRegistry: LayoutSlotRegistryContextType = useMemo(() => {
		return {
			activeSlots,
			registerLayoutSlot,
			unregisterLayoutSlot,
		}
	}, [activeSlots, registerLayoutSlot, unregisterLayoutSlot])

	const createLayoutSlotPortal = useCallback((name: string, children: ReactNode) => {
		const element = slotsMap.get(name)

		if (element?.current) {
			scopedConsoleRef.current.log(`Creating portal for slot '${name}', target:`, element.current)
			return createPortal(children, element.current)
		} else {
			scopedConsoleRef.current.warn(`Cannot create portal because slot '${name}' is not yet registered`)
			return null
		}
	}, [scopedConsoleRef, slotsMap])

	const registerLayoutSlotPortal = useCallback((id: string, name: string) => {
		if (activeSlotsMapRef.current.has(id)) {
			throw new Error(`Cannot register layout slot portal for '${name}' because it is already registered. You have likely forgotten to unregister it.`)
		}

		setActiveSlotsMap(activeSlots => new Map([...activeSlots, [id, name]]))
	}, [])

	const unregisterLayoutSlotPortal = useCallback((name: string) => {
		setActiveSlotsMap(activeSlots => {
			activeSlots.delete(name)
			return new Map([...activeSlots])
		})
	}, [])

	const renderToSlotPortal = useMemo(() => ({
		createLayoutSlotPortal,
		registerLayoutSlotPortal,
		unregisterLayoutSlotPortal,
	}), [createLayoutSlotPortal, registerLayoutSlotPortal, unregisterLayoutSlotPortal])

	return (
		<RenderToSlotPortalContext.Provider value={renderToSlotPortal}>
			<LayoutSlotRegistryContext.Provider value={layoutSlotRegistry}>
				{children}
			</LayoutSlotRegistryContext.Provider>
		</RenderToSlotPortalContext.Provider>
	)
})
LayoutSlotsProvider.displayName = 'Layout.SlotsProvider'
