import { PropsWithRequiredChildren } from '@contember/react-utils'
import { Stack, StackOwnProps } from '@contember/ui'
import { ComponentType, createElement, memo } from 'react'
import { usePortalsRegistryContext } from './contexts'

/**
 * @deprecated Use `createSlotPortalComponent()` directly instead.
 */
export function wrapSlotWithStack<C extends ComponentType<PropsWithRequiredChildren>>(Component: C) {
	if (import.meta.env.DEV) {
		throw new Error(
			'wrapSlotWithStack() is deprecated. Use `createSlotPortalComponent()` directly instead. ' +
			'Slot targets should set `display: contents` and therefore leave the responsibility ' +
			'to control the layout to their immediate parent containers.')
	}

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

/** @deprecated Use `usePortalsRegistryContext()` instead. */
export const useRenderToSlotPortalContext = usePortalsRegistryContext
