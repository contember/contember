import { useComposeRef } from '@contember/react-utils'
import { NestedClassName, PolymorphicComponentPropsWithRef, PolymorphicRef, dataAttribute, useClassName } from '@contember/utilities'
import React, { ElementType, ReactNode, forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
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
		const Container = as ?? 'div'
		const { behavior, visibility } = useLayoutPanelContext()

		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(elementRef, forwardedRef)

		const insetsStyle = useElementInsetCustomProperties(elementRef, '--container-inset-')

		return (
			<Container
				as={typeof Container === 'string' ? undefined : 'div'}
				ref={composeRef}
				className={useClassName(componentClassName, className)}
				data-behavior={dataAttribute(behavior)}
				data-has-insets={dataAttribute(true)}
				data-visibility={dataAttribute(visibility ?? 'hidden')}
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
