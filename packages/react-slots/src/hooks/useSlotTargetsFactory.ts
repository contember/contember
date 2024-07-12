import { useHasActiveSlotsFactory } from './useHasActiveSlotsFactory'
import { createElement, Fragment, useCallback } from 'react'
import { createSlotTargetComponent } from '../factories'
import { SlotTargetComponentsRecord } from '../factories'

/**
 * Creates a function that returns a list of slot targets if any of them are active.
 * @param SlotTargets - List of slot targets to create
 */
export function useSlotTargetsFactory<R extends SlotTargetComponentsRecord<string>>(SlotTargets: R) {
	const hasActiveSlot = useHasActiveSlotsFactory()

	return useCallback(function createSlotTargets<T>(slots: ReadonlyArray<keyof R & string>, override?: T) {
		if (hasActiveSlot(...slots)) {
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
	}, [SlotTargets, hasActiveSlot])
}
