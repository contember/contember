import { createNonNullableContextFactory, noop } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import { Fragment, createElement, useCallback } from 'react'
import { createSlotTargetComponent } from './createSlotTargetComponent'
import { SlotTargetComponentsRecord } from './types'

export type SlotsRefMap = Map<string, HTMLElement>
export type RegisterSlotTarget = (id: string, name: string, ref: HTMLElement) => void;
export type UnregisterSlotTarget = (id: string, name: string) => void;

export type ActiveSlotPortalsContextType = Set<string>;
export const [ActiveSlotPortalsContext, useActiveSlotPortalsContext] = createNonNullableContextFactory<ActiveSlotPortalsContextType>('ActiveSlotPortalsContext', new Set())

export function useHasActiveSlotsFactory<T extends SlotTargetComponentsRecord<string>>(SlotTargets: T) {
	const activeSlotPortals = useActiveSlotPortalsContext()

	return useCallback((...slots: ReadonlyArray<keyof T & string>) => {
		return slots.some(slot => activeSlotPortals.has(slot))
	}, [activeSlotPortals])
}

/**
 * Creates a function that returns a list of slot targets if any of them are active.
 * @param SlotTargets - List of slot targets to create
 */
export function useSlotTargetsFactory<R extends SlotTargetComponentsRecord<string>>(SlotTargets: R) {
	const activeSlotPortals = useActiveSlotPortalsContext()

	return useCallback(function createSlotTargets<T>(slots: ReadonlyArray<keyof R & string>, override?: T) {
		if (slots.some(slot => activeSlotPortals.has(slot))) {
			if (override) {
				return override
			} else {
				return createElement(Fragment, {}, ...slots.map(slot => {
					if (slot in SlotTargets) {
						const Target = SlotTargets[slot] as ReturnType<typeof createSlotTargetComponent<typeof slot>>

						return createElement(Target, {
							key: `multi-element:${slot}`,
						})
					} else {
						throw new Error(`Slot target "${slot}" was not found within the targets passed to factory.`)
					}
				}))
			}
		} else {
			return null
		}
	}, [SlotTargets, activeSlotPortals])
}
/**
 * Fallback for `useSlotTargetsFactory` for backwards compatibility.
 * @deprecated Use `useSlotTargetsFactory` instead
 */
export function useTargetsIfActiveFactory<R extends SlotTargetComponentsRecord<string>>(SlotTargets: R) {
	deprecate('1.3.0', true, '`useTargetsIfActiveFactory()`', '`useSlotTargetsFactory()`')
	return useSlotTargetsFactory(SlotTargets)
}

export type SlotTargetsRegistryContextType = {
	registerSlotTarget: RegisterSlotTarget;
	unregisterSlotTarget: UnregisterSlotTarget;
}
export const [TargetsRegistryContext, useTargetsRegistryContext] = createNonNullableContextFactory<SlotTargetsRegistryContextType>('Layout.Slots.TargetsRegistryContext', {
	registerSlotTarget: noop,
	unregisterSlotTarget: noop,
})

export type RenderToSlotPortalContextType = {
	getTarget: undefined | ((slot: string) => HTMLElement | null | undefined);
	/** @deprecated Use `getTarget` instead */
	createSlotPortal?: never;
	registerSlotSource: undefined | ((id: string, slot: string) => void);
	unregisterSlotSource: undefined | ((id: string, slot: string) => void);
}

export const [PortalsRegistryContext, usePortalsRegistryContext] = createNonNullableContextFactory<RenderToSlotPortalContextType>('Layout.Slots.PortalsRegistryContext', {
	getTarget: undefined,
	registerSlotSource: undefined,
	unregisterSlotSource: undefined,
})
