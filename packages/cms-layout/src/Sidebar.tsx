import { Layout, LayoutPanelState, MenuAutoCloseProvider, useClosePanelOnEscape, useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '@contember/layout'
import { useComposeRef, useReferentiallyStableCallback } from '@contember/react-utils'
import { PolymorphicRef, useClassName } from '@contember/utilities'
import { ElementType, forwardRef, memo, useRef } from 'react'
import { CMSLayoutSidebarComponentType, CMSLayoutSidebarProps } from './Types'

export const Sidebar: CMSLayoutSidebarComponentType = memo(forwardRef(
	<C extends ElementType = 'section'>({
		as,
		children,
		className,
		componentClassName = 'cms-sidebar',
		keepVisible = false,
		panelName,
		width,
		priority,
	}: CMSLayoutSidebarProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const keepVisibleBehavior = useReferentiallyStableCallback(({ behavior }: LayoutPanelState) => {
			if (behavior !== 'modal') {
				return { visibility: 'visible' } as const
			}
		})

		const onEscapePress = useClosePanelOnEscape()

		const { hide } = useSetLayoutPanelsStateContext()
		const panelState = useGetLayoutPanelsStateContext().panels.get(panelName)

		const visibility = panelState?.visibility
		const behavior = panelState?.behavior

		const hideModal = useReferentiallyStableCallback(() => {
			if (behavior === 'modal' && visibility === 'visible') {
				hide(panelName)
			}
		})

		const elementRef = useRef<HTMLElement>(null)
		const composeRef = useComposeRef(forwardedRef, elementRef)

		return (
			<Layout.Panel
				// Too complicated to type properly internally, so we just cast it to `any`
				// because the outer PolymorphicRef types ensure proper typing of `as` prop.
				as={as as any}
				ref={composeRef}
				basis={width}
				minWidth={width}
				maxWidth={width}
				className={useClassName(componentClassName, className)}
				defaultBehavior="collapsible"
				defaultVisibility="visible"
				name={panelName}
				onBehaviorChange={keepVisible ? keepVisibleBehavior : undefined}
				onKeyPress={onEscapePress}
				onVisibilityChange={undefined}
				priority={priority}
			>
				<MenuAutoCloseProvider onAutoClose={hideModal}>
					{children}
				</MenuAutoCloseProvider>
			</Layout.Panel>
		)
	},
))
Sidebar.displayName = 'CMSLayout.Sidebar'
