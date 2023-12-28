import { Target } from './Target'
import { SlotTargetProps } from './types'

export function createSlotTargetComponent<T extends string>(name: T) {
	const Component = ({ className, ...props }: Omit<SlotTargetProps, 'name'> & { name?: string }) => {
		return (
			<Target name={name} className={className} {...props} />
		)
	}

	Component.displayName = `Layout.Slots.Target(${name})`
	Component.slot = name as T

	return Component
}
