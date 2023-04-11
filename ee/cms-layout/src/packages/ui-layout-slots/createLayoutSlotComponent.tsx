import { LayoutSlotPortal, LayoutSlotProps } from './LayoutSlotPortal'

export function createLayoutSlotComponent(target: string | string[], displayName?: string, defaultContent: React.ReactNode = null) {
	const Slot = ({ children }: Omit<LayoutSlotProps, 'target'>) => {
		const content = (
			children !== null
				? children ?? defaultContent
				: null
		)

		if (typeof target === 'string') {
			return (
				<LayoutSlotPortal target={target}>{content}</LayoutSlotPortal>
			)
		} else {
			return (
				<>
					{target.map(targetName => (
						<LayoutSlotPortal key={targetName} target={targetName}>{content}</LayoutSlotPortal>
					))}
				</>
			)
		}
	}

	Slot.displayName = displayName ?? `LayoutSlotPortal(${target})`

	return Slot
}
