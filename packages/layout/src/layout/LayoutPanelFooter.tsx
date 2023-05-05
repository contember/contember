import { useComposeRef, useHasEmptySlotsClassName } from '@contember/react-utils'
import { classNameForFactory, NestedClassName, PolymorphicComponentPropsWithRef, PolymorphicRef } from '@contember/utilities'
import React, { ElementType, forwardRef, memo, ReactNode, useId, useRef } from 'react'
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
		const id = `LayoutPanelFooter#${useId()}`
		const Container = as ?? 'footer'
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
				as={typeof Container === 'string' ? undefined : 'footer'}
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
LayoutPanelFooter.displayName = 'Layout.PanelFooter'
