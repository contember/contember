import { PascalCase } from '@contember/utilities'
import { Source } from './Source'
import { SourcePortalProps } from './types'

export function createSlotSourceComponent<T extends string>(slot: T, displayName?: string, defaultContent: React.ReactNode = null) {
	const Component = ({ name, children }: Omit<SourcePortalProps, 'name'> & { name?: PascalCase<string> }) => {
		const content = (
			children !== null
				? children ?? defaultContent
				: null
		)

		return (
			<Source name={name ?? slot}>{content}</Source>
		)
	}

	Component.displayName = displayName ?? `Interface.Slots.Source(${name})`
	Component.slot = slot as T

	return Component
}
