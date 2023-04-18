import { Stack, StackOwnProps, StackProps } from '@contember/admin'
import { forwardRef, memo } from 'react'
import { NativeProps } from '../typescript-utilities'
import { useLayoutContainerWidth } from '../ui-layout'

type ResponsiveProps<P> = {
	[K in keyof P]: P[K] | ((layoutContainerWidth: number) => P[K])
}

export type OwnResponsiveStackProps = ResponsiveProps<StackOwnProps>

export interface ResponsiveStackProps extends OwnResponsiveStackProps, Omit<NativeProps<HTMLDivElement>, keyof StackOwnProps> { }

export const ResponsiveStack = memo(
	forwardRef<HTMLDivElement, ResponsiveStackProps>((props, ref) => {
		const layoutWidth = useLayoutContainerWidth()

		const stackProps = Object.fromEntries(
			Object.entries(props).map(([key, value]) => {
				if (typeof value === 'function') {
					return [key, value(layoutWidth)]
				} else {
					return [key, value]
				}
			}),
		) as unknown as StackProps

		return (
			<Stack
				ref={ref as any}
				{...stackProps}
			/>
		)
	}),
)
ResponsiveStack.displayName = 'ResponsiveStack'
