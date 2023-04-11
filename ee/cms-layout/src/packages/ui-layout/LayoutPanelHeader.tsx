import React, { ElementType, forwardRef, memo, ReactNode, useId, useRef } from 'react'
import { classNameForFactory, NestedClassName } from '../class-name'
import { useComposeRef, useHasEmptySlotsClassName } from '../react-hooks'
import { PolymorphicComponentPropsWithRef, PolymorphicRef } from '../typescript-utilities'
import { useElementInsetCustomProperties } from '../ui-insets'
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
		const id = `LayoutPanelHeader#${useId()}`
		const Container = as ?? 'header'
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
				as={typeof Container === 'string' ? undefined : 'header'}
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
LayoutPanelHeader.displayName = 'Layout.PanelHeader'
