import { createContext, noop } from '@contember/react-utils'


export type RegisterSlotTarget = (id: string, name: string, ref: HTMLElement) => () => void
export type UnregisterSlotTarget = (id: string, name: string) => void

export type ActiveSlotPortalsContextType = Set<string>
export const [ActiveSlotPortalsContext, useActiveSlotPortalsContext] = createContext<ActiveSlotPortalsContextType>('ActiveSlotPortalsContext', new Set())

export type SlotTargetsRegistryContextType = {
	registerSlotTarget: RegisterSlotTarget;
	unregisterSlotTarget: UnregisterSlotTarget;
}
export const [TargetsRegistryContext, useTargetsRegistryContext] = createContext<SlotTargetsRegistryContextType>('Layout.Slots.TargetsRegistryContext', {
	registerSlotTarget: () => () => undefined,
	unregisterSlotTarget: noop,
})

export type RenderToSlotPortalContextType = {
	getTarget: undefined | ((slot: string) => HTMLElement |  undefined)
	registerSlotSource: undefined | ((id: string, slot: string) => () => void)
	unregisterSlotSource: undefined | ((id: string, slot: string) => void)
}

export const [PortalsRegistryContext, usePortalsRegistryContext] = createContext<RenderToSlotPortalContextType>('Layout.Slots.PortalsRegistryContext', {
	getTarget: undefined,
	registerSlotSource: undefined,
	unregisterSlotSource: undefined,
})
