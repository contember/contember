import React, { ElementType, forwardRef, memo, ReactNode, useId, useRef } from 'react'
import { classNameForFactory, NestedClassName } from '../class-name'
import { useComposeRef, useHasEmptySlotsClassName } from '../react-hooks'
import { PolymorphicComponentPropsWithRef, PolymorphicRef } from '../typescript-utilities'
import { useElementInsetCustomProperties } from './useElementInsetCustomProperties'

type OwnInsetsConsumerProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type InsetsConsumerProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnInsetsConsumerProps>

export type InsetsConsumerComponentType = (<C extends ElementType = 'div'>(
	props: InsetsConsumerProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const InsetsConsumer: InsetsConsumerComponentType = memo(forwardRef(
	<C extends ElementType = 'div'>({
		as,
		children,
		className,
		componentClassName = 'has-insets',
		style,
		...rest
	}: InsetsConsumerProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const Container = as ?? 'div'
		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(elementRef, forwardedRef)

		const insetsStyle = useElementInsetCustomProperties(elementRef, '--container-inset-')

		const classNameFor = classNameForFactory(componentClassName, className)

		return (
			<Container
				as={typeof Container === 'string' ? undefined : 'div'}
				ref={composeRef}
				className={classNameFor(null, useHasEmptySlotsClassName(elementRef))}
				style={{
					...insetsStyle,
					...style,
				}}
				{...rest}
			>
				{children}
			</Container>
		)
	},
))
InsetsConsumer.displayName = 'InsetsConsumer'
