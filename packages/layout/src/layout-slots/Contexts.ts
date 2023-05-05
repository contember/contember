import { createNonNullableContextFactory } from '@contember/react-utils'
import { ReactNode, ReactPortal, RefObject } from 'react'

export type LayoutSlotsRegistry = Map<string, RefObject<HTMLElement>>
export type RegisterLayoutSlot = (name: string, ref: RefObject<HTMLElement>) => void;
export type SetLayoutSlotChildrenCount = (name: string, count: number) => void;
export type UnregisterLayoutSlot = (name: string) => void;
export type LayoutSlotRegistryContextType = {
	activeSlots: Set<string>;
	registerLayoutSlot: RegisterLayoutSlot;
	unregisterLayoutSlot: UnregisterLayoutSlot;
}
export const [LayoutSlotRegistryContext, useLayoutSlotRegistryContext] = createNonNullableContextFactory<LayoutSlotRegistryContextType>('LayoutSlotRegistryContext')
LayoutSlotRegistryContext.displayName = 'LayoutSlotRegistryContext'

export type CreateLayoutSlotPortal = (target: string, children: ReactNode) => ReactPortal | null;
export type RegisterLayoutSlotPortal = (id: string, target: string) => void;
export type UnregisterLayoutSlotPortal = (id: string, target: string) => void;

export type RenderToSlotPortalContextType = {
	createLayoutSlotPortal: CreateLayoutSlotPortal;
	registerLayoutSlotPortal: RegisterLayoutSlotPortal;
	unregisterLayoutSlotPortal: UnregisterLayoutSlotPortal;
}

export const [RenderToSlotPortalContext, useRenderToSlotPortalContext] = createNonNullableContextFactory<RenderToSlotPortalContextType>('RenderToSlotPortalContext')
RenderToSlotPortalContext.displayName = 'RenderToSlotPortalContext'
