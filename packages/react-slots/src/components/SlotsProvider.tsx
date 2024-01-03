import { memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import {
	ActiveSlotPortalsContext,
	PortalsRegistryContext,
	RenderToSlotPortalContextType,
	SlotTargetsRegistryContextType,
	TargetsRegistryContext,
} from '../internal/contexts'

/**
 * @group Layout
 */
export const SlotsProvider = memo<{ children: ReactNode }>(({ children }) => {
	const [slotsRefMap, setSlotsRefMap] = useState<Map<string, HTMLElement>>(new Map)
	const [activeSlotsMap, setActiveSlotsMap] = useState<Map<string, string>>(new Map)
	const activeSlotPortals: Set<string> = useMemo(() => new Set(activeSlotsMap.values()), [activeSlotsMap])

	const activeSlotsMapRef = useRef(activeSlotsMap); activeSlotsMapRef.current = activeSlotsMap

	// TODO: refactor to use ID
	const unregisterSlotTarget = useCallback((id: string, name: string) => {
		setSlotsRefMap(previous => {
			const newVal = new Map([...previous])
			newVal.delete(name)
			return newVal
		})
	}, [])

	const registerSlotTarget = useCallback((id: string, name: string, ref: HTMLElement) => {
		setSlotsRefMap(previous => new Map([...previous, [name, ref]]))

		return () => {
			unregisterSlotTarget(id, name)
		}
	}, [unregisterSlotTarget])


	const slotTargetsRegistry: SlotTargetsRegistryContextType = useMemo(() => {
		return {
			activeSlotPortals,
			registerSlotTarget,
			unregisterSlotTarget,
		}
	}, [activeSlotPortals, registerSlotTarget, unregisterSlotTarget])

	const getTarget = useCallback((name: string) => {
		return slotsRefMap.get(name)
	}, [slotsRefMap])

	const unregisterSlotSource = useCallback((id: string, name: string) => {
		setActiveSlotsMap(previous => {
			const newVal = new Map([...previous])
			newVal.delete(id)
			return newVal
		})
	}, [])

	const registerSlotSource = useCallback((id: string, name: string) => {
		if (activeSlotsMapRef.current.has(id)) {
			throw new Error(`Cannot register slot portal for '${name}' because it is already registered. You have likely forgotten to unregister it.`)
		}

		setActiveSlotsMap(previous => new Map([...previous, [id, name]]))

		return () => {
			unregisterSlotSource(id, name)
		}
	}, [unregisterSlotSource])

	const renderToSlotPortal: RenderToSlotPortalContextType = useMemo(() => ({
		getTarget,
		registerSlotSource,
		unregisterSlotSource,
	}), [getTarget, registerSlotSource, unregisterSlotSource])

	return (
		<PortalsRegistryContext.Provider value={renderToSlotPortal}>
			<TargetsRegistryContext.Provider value={slotTargetsRegistry}>
				<ActiveSlotPortalsContext.Provider value={activeSlotPortals}>
					{children}
				</ActiveSlotPortalsContext.Provider>
			</TargetsRegistryContext.Provider>
		</PortalsRegistryContext.Provider>
	)
})
SlotsProvider.displayName = 'Layout.Slots.Provider'
