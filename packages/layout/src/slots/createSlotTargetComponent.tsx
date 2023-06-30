import { pascalCase } from 'change-case'
import { Target } from './Target'
import { TargetProps } from './types'

export function createSlotTargetComponent<T extends string>(name: T, displayName?: string) {
	const Component = ({ className, ...props }: Omit<TargetProps, 'name'>) => {
		return (
			<Target name={pascalCase(name)} className={className} {...props} />
		)
	}

	Component.displayName = displayName ?? `Interface.Slots.Target(${name})`
	Component.slot = name as T

	return Component
}
