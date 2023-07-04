import { ReactNode, RefObject, memo, useCallback, useMemo, useRef, useState } from 'react'
import { ActiveSlotPortalsContext, PortalsRegistryContext, SlotTargetsRegistryContextType, SlotsRefMap, TargetsRegistryContext } from './contexts'

export const Provider = memo<{ children: ReactNode }>(({ children }) => {
	const [slotsRefMap, setSlotsRefMap] = useState<SlotsRefMap>(new Map)
	const [activeSlotsMap, setActiveSlotsMap] = useState<Map<string, string>>(new Map)
	const activeSlotPortals: Set<string> = useMemo(() => new Set(activeSlotsMap.values()), [activeSlotsMap])

	const activeSlotsMapRef = useRef(activeSlotsMap); activeSlotsMapRef.current = activeSlotsMap

	const registerSlotTarget = useCallback((name: string, ref: RefObject<HTMLElement>) => {
		setSlotsRefMap(previous => new Map([...previous, [name, ref]]))
	}, [])

	const unregisterSlotTarget = useCallback((name: string) => {
		setSlotsRefMap(previous => {
			previous.delete(name)
			return new Map([...previous])
		})
	}, [])

	const slotRegistry: SlotTargetsRegistryContextType = useMemo(() => {
		return {
			activeSlotPortals,
			registerSlotTarget,
			unregisterSlotTarget,
		}
	}, [activeSlotPortals, registerSlotTarget, unregisterSlotTarget])

	const getTarget = useCallback((name: string) => {
		return slotsRefMap.get(name)?.current
	}, [slotsRefMap])

	const registerSlotSource = useCallback((id: string, name: string) => {
		if (activeSlotsMapRef.current.has(id)) {
			throw new Error(`Cannot register slot portal for '${name}' because it is already registered. You have likely forgotten to unregister it.`)
		}

		setActiveSlotsMap(previous => new Map([...previous, [id, name]]))
	}, [])

	const unregisterSlotSource = useCallback((name: string) => {
		setActiveSlotsMap(previous => {
			previous.delete(name)
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
			<TargetsRegistryContext.Provider value={slotRegistry}>
				<ActiveSlotPortalsContext.Provider value={activeSlotPortals}>
					{children}
				</ActiveSlotPortalsContext.Provider>
			</TargetsRegistryContext.Provider>
		</PortalsRegistryContext.Provider>
	)
})
Provider.displayName = 'Interface.Slots.Provider'
