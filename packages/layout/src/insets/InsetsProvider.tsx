import { useComposeRef } from '@contember/react-utils'
import { classNameForFactory, NestedClassName, PolymorphicComponentPropsWithRef, PolymorphicRef } from '@contember/utilities'
import React, { ElementType, forwardRef, memo, ReactNode, useMemo, useRef } from 'react'
import { ContainerInsetsContext } from './Contexts'

export type OwnInsetsProviderProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
	bottom: number;
	left: number;
	right: number;
	top: number;
}

export type InsetsProviderProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnInsetsProviderProps>

export type InsetsProviderComponentType = (<C extends ElementType = 'div'>(
	props: InsetsProviderProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const InsetsProvider: InsetsProviderComponentType = memo(forwardRef(
	<C extends ElementType = 'div'>({
		as,
		bottom,
		left,
		right,
		top,
		children,
		className,
		componentClassName = 'insets-provider',
		...rest
	}: InsetsProviderProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const Container = as ?? 'div'

		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(elementRef, forwardedRef)

		const classNameFor = classNameForFactory(componentClassName, className)

		return (
			<Container
				as={typeof Container === 'string' ? undefined : 'div'}
				ref={composeRef}
				className={classNameFor()}
				{...rest}
			>
				<ContainerInsetsContext.Provider value={useMemo(() => (
					{ bottom, left, right, top }
				), [bottom, left, right, top])}>
					{children}
				</ContainerInsetsContext.Provider>
			</Container>
		)
	},
))
InsetsProvider.displayName = 'InsetsProvider'
