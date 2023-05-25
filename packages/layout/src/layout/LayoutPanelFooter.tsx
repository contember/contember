import { useComposeRef } from '@contember/react-utils'
import { NestedClassName, PolymorphicComponentPropsWithRef, PolymorphicRef, dataAttribute, useClassName } from '@contember/utilities'
import React, { ElementType, ReactNode, forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
import { useLayoutPanelContext } from './Contexts'

export type OwnLayoutPanelFooterProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type LayoutPanelFooterProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnLayoutPanelFooterProps>

export type LayoutPanelFooterComponentType = (<C extends ElementType = 'footer'>(
	props: LayoutPanelFooterProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const LayoutPanelFooter: LayoutPanelFooterComponentType = memo(forwardRef(
	<C extends ElementType = 'footer'>({
		as,
		children,
		className,
		componentClassName = 'layout-panel-footer',
		style,
		...rest
	}: LayoutPanelFooterProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const Container = as ?? 'footer'
		const { behavior, visibility } = useLayoutPanelContext()

		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(elementRef, forwardedRef)

		const insetsStyle = useElementInsetCustomProperties(elementRef, '--container-inset-')

		return (
			<Container
				as={typeof Container === 'string' ? undefined : 'footer'}
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
LayoutPanelFooter.displayName = 'Layout.PanelFooter'
