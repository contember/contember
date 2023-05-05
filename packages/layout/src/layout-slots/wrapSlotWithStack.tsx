import { PropsWithRequiredChildren } from '@contember/react-utils'
import { Stack, StackOwnProps } from '@contember/ui'
import { ComponentType, createElement, memo } from 'react'

export function wrapSlotWithStack<C extends ComponentType<PropsWithRequiredChildren>>(Component: C) {
	const WrappedComponent = memo<Partial<StackOwnProps>>(({
		direction = 'vertical',
		gap = 'large',
		...rest
	}) => {
		return createElement(
			Component,
			{
				children: <Stack direction={direction} gap={gap} {...rest} />,
			},
		)
	})
	WrappedComponent.displayName = Component.displayName

	return WrappedComponent
}
