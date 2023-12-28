import { ReactNode, memo, useCallback, useMemo, useRef, useState } from 'react'
import { ActiveSlotPortalsContext, PortalsRegistryContext, SlotTargetsRegistryContextType, SlotsRefMap, TargetsRegistryContext } from './contexts'

/**
 * @group Layout
 */
export const Provider = memo<{ children: ReactNode }>(({ children }) => {
	const [slotsRefMap, setSlotsRefMap] = useState<SlotsRefMap>(new Map)
	const [activeSlotsMap, setActiveSlotsMap] = useState<Map<string, string>>(new Map)
	const activeSlotPortals: Set<string> = useMemo(() => new Set(activeSlotsMap.values()), [activeSlotsMap])

	const activeSlotsMapRef = useRef(activeSlotsMap); activeSlotsMapRef.current = activeSlotsMap

	// TODO: refactor to use ID
	const registerSlotTarget = useCallback((id: string, name: string, ref: HTMLElement) => {
		setSlotsRefMap(previous => new Map([...previous, [name, ref]]))
	}, [])

	const unregisterSlotTarget = useCallback((id: string, name: string) => {
		setSlotsRefMap(previous => {
			previous.delete(name)
			return new Map([...previous])
		})
	}, [])

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

	const registerSlotSource = useCallback((id: string, name: string) => {
		if (activeSlotsMapRef.current.has(id)) {
			throw new Error(`Cannot register slot portal for '${name}' because it is already registered. You have likely forgotten to unregister it.`)
		}

		setActiveSlotsMap(previous => new Map([...previous, [id, name]]))
	}, [])

	const unregisterSlotSource = useCallback((id: string, name: string) => {
		setActiveSlotsMap(previous => {
			previous.delete(id)
			return new Map([...previous])
		})
	}, [])

	const renderToSlotPortal = useMemo(() => ({
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
Provider.displayName = 'Layout.Slots.Provider'
