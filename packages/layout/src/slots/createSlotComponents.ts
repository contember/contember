import { PascalCase } from '@contember/utilities'
import { pascalCase } from 'change-case'
import { createSlotSourceComponent } from './createSlotSourceComponent'
import { createSlotTargetComponent } from './createSlotTargetComponent'
import type {
	SlotSourceComponentsRecord,
	SlotTargetComponentsRecord,
} from './types'

export function createSlotComponents<K extends PascalCase<string>>(slots: ReadonlyArray<PascalCase<K>>) {
	const sources = Object.freeze(
		Object.fromEntries(slots.map(
			slot => [pascalCase(slot), createSlotSourceComponent(pascalCase(slot), slot)],
		)) as SlotSourceComponentsRecord<K>,
	)

	const targets = Object.freeze(
		Object.fromEntries(slots.map(
			slot => [pascalCase(slot), createSlotTargetComponent(pascalCase(slot), slot)]),
		) as SlotTargetComponentsRecord<K>,
	)

	return [slots, sources, targets] as const
}
