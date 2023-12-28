import { Source } from './Source'
import { SlotSourceProps } from './types'

export function createSlotSourceComponent<T extends string>(slot: T) {
	const Component = ({ name, children }: Omit<SlotSourceProps, 'name'> & { name?: string }) => (
		<Source name={name ?? slot}>{children}</Source>
	)

	Component.displayName = `Layout.Source(${slot})`
	Component.slot = slot as T

	return Component
}
