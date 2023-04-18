import React, { ElementType, forwardRef, memo, ReactNode, useId, useRef } from 'react'
import { classNameForFactory, NestedClassName } from '../class-name'
import { useComposeRef, useHasEmptySlotsClassName } from '../react-hooks'
import { PolymorphicComponentPropsWithRef, PolymorphicRef } from '../typescript-utilities'
import { useElementInsetCustomProperties } from '../ui-insets'
import { useLayoutPanelContext } from './Contexts'

export type OwnLayoutPanelBodyProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type LayoutPanelBodyProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnLayoutPanelBodyProps>

export type LayoutPanelBodyComponentType = (<C extends ElementType = 'div'>(
	props: LayoutPanelBodyProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const LayoutPanelBody: LayoutPanelBodyComponentType = memo(forwardRef(
	<C extends ElementType = 'div'>({
		as,
		children,
		className,
		componentClassName = 'layout-panel-body',
		style,
		...rest
	}: LayoutPanelBodyProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const id = `LayoutPanelBody#${useId()}`
		const Container = as ?? 'div'
		const { behavior, visibility } = useLayoutPanelContext()

		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(elementRef, forwardedRef)

		const insetsStyle = useElementInsetCustomProperties(elementRef, '--container-inset-')

		const classNameFor = classNameForFactory(componentClassName, className, {
			[`${componentClassName}-behavior`]: behavior,
			[`${componentClassName}-visibility`]: visibility ?? 'hidden',
			'has-insets': true,
		})

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
LayoutPanelBody.displayName = 'Layout.PanelBody'
