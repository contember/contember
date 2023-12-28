import { createSlotSourceComponent } from './createSlotSourceComponent'
import { createSlotTargetComponent } from './createSlotTargetComponent'
import type { SlotSourceComponentsRecord, SlotTargetComponentsRecord } from './types'

const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/

export function createSlotComponents<K extends string>(slots: readonly K[]) {

	slots.forEach(slot => {
		if (!pascalCaseRegex.test(slot)) {
			throw new Error(`Slot name "${slot}" is not in pascal case.`)
		}
	})

	const sources = Object.freeze(
		Object.fromEntries(slots.map(
			slot => [slot, createSlotSourceComponent(slot)],
		)) as SlotSourceComponentsRecord<K>,
	)

	const targets = Object.freeze(
		Object.fromEntries(slots.map(
			slot => [slot, createSlotTargetComponent(slot)]),
		) as SlotTargetComponentsRecord<K>,
	)

	return [slots, sources, targets] as const
}
