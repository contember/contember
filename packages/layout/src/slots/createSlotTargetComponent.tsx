import { pascalCase } from 'change-case'
import { Target } from './Target'
import { SlotTargetProps } from './types'

export function createSlotTargetComponent<T extends string>(name: T, displayName?: string) {
	const Component = ({ className, ...props }: Omit<SlotTargetProps, 'name'>) => {
		return (
			<Target name={pascalCase(name)} className={className} {...props} />
		)
	}

	Component.displayName = displayName ?? `Layout.Slots.Target(${name})`
	Component.slot = name as T

	return Component
}
