import { useComposeRef } from '@contember/react-utils'
import { NestedClassName, PolymorphicComponentPropsWithRef, PolymorphicRef, dataAttribute, useClassName } from '@contember/utilities'
import React, { ElementType, ReactNode, forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
import { useLayoutPanelContext } from './Contexts'

export type OwnLayoutPanelHeaderProps = {
	children?: ReactNode;
	className?: NestedClassName;
	componentClassName?: string;
}

export type LayoutPanelHeaderProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnLayoutPanelHeaderProps>

export type LayoutPanelHeaderComponentType = (<C extends ElementType = 'header'>(
	props: LayoutPanelHeaderProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const LayoutPanelHeader: LayoutPanelHeaderComponentType = memo(forwardRef(
	<C extends ElementType = 'header'>({
		as,
		children,
		className,
		componentClassName = 'layout-panel-header',
		style,
		...rest
	}: LayoutPanelHeaderProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const Container = as ?? 'header'
		const { behavior, visibility } = useLayoutPanelContext()

		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(elementRef, forwardedRef)

		const insetsStyle = useElementInsetCustomProperties(elementRef, '--container-inset-')

		return (
			<Container
				as={typeof Container === 'string' ? undefined : 'header'}
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
LayoutPanelHeader.displayName = 'Layout.PanelHeader'
