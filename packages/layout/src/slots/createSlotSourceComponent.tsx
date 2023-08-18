import { PascalCase } from '@contember/utilities'
import { Source } from './Source'
import { SlotSourceProps } from './types'

export function createSlotSourceComponent<T extends string>(slot: T, displayName?: string) {
	const Component = ({ name, children }: Omit<SlotSourceProps, 'name'> & { name?: PascalCase<string> }) => (
		<Source name={name ?? slot}>{children}</Source>
	)

	Component.displayName = displayName ?? `Layout.Source(${slot})`
	Component.slot = slot as T

	return Component
}
