import { useCallback } from 'react'
import { useActiveSlotPortalsContext } from '../internal/contexts.js'
import { SlotTargetComponentsRecord } from '../factories/index.js'

/**
 * Creates a function which returns true if any of the slots passed to it are active.
 */
export function useHasActiveSlotsFactory<T extends SlotTargetComponentsRecord<string>>() {
	const activeSlotPortals = useActiveSlotPortalsContext()

	return useCallback((...slots: ReadonlyArray<keyof T & string>) => {
		return slots.some(slot => activeSlotPortals.has(slot))
	}, [activeSlotPortals])
}
