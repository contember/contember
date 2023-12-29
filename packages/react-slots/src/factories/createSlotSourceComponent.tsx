import { SlotSourceProps, SlotSource } from '../components/SlotSource'
import { ComponentType } from 'react'

export type SlotSourceComponentProps = Omit<SlotSourceProps, 'name'>
export type SlotSourceComponent<T extends string> =
	& ComponentType<SlotSourceComponentProps>
	& {
		slot: T
	}

export function createSlotSourceComponent<T extends string>(slot: T): SlotSourceComponent<T> {
	const Component = ({ children }: SlotSourceComponentProps) => (
		<SlotSource name={slot}>{children}</SlotSource>
	)

	Component.displayName = `Layout.Source(${slot})`
	Component.slot = slot as T

	return Component
}
