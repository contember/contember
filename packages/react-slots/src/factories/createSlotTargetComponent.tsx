import { SlotTargetProps, SlotTarget } from '../components/SlotTarget'
import { ComponentType } from 'react'

export type SlotTargetComponentProps = Omit<SlotTargetProps, 'name'>
export type SlotTargetComponent<T extends string> =
	& ComponentType<SlotTargetComponentProps>
	& {
		slot: T
	}

export function createSlotTargetComponent<T extends string>(name: T): SlotTargetComponent<T> {
	const Component = ({ className, ...props }: SlotTargetComponentProps) => (
		<SlotTarget name={name} className={className} {...props} />
	)

	Component.displayName = `Layout.Slots.Target(${name})`
	Component.slot = name as T

	return Component
}
