import { LayoutSlotTarget, LayoutSlotTargetProps } from './LayoutSlotTarget'

export function createLayoutSlotTargetComponent(name: string, displayName?: string) {
	const Slot = ({ className, ...props }: Omit<LayoutSlotTargetProps, 'name'>) => {
		return (
			<LayoutSlotTarget name={name} className={className} {...props} />
		)
	}

	Slot.displayName = displayName ?? `LayoutSlotTarget(${name})`

	return Slot
}
