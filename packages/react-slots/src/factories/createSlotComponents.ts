import { createSlotSourceComponent, SlotSourceComponent } from './createSlotSourceComponent'
import { createSlotTargetComponent, SlotTargetComponent } from './createSlotTargetComponent'

const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/

export type SlotSourceComponentsRecord<K extends string> = Readonly<{
	readonly [P in K]: SlotSourceComponent<P>
}>

export type SlotTargetComponentsRecord<K extends string> = Readonly<{
	readonly [P in K]: SlotTargetComponent<P>
}>

export type SlotComponents<K extends string> = readonly [
	readonly K[],
	SlotSourceComponentsRecord<K>,
	SlotTargetComponentsRecord<K>,
]

export function createSlotComponents<K extends string>(slots: readonly K[]): SlotComponents<K> {

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
