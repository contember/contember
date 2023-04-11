import { Spacer, Stack } from '@contember/admin'
import { mergeProps } from '@react-aria/utils'
import { memo, useCallback, useMemo } from 'react'
import { classNameForFactory, stateClassName } from '../packages/class-name'
import { setHasOneOf } from '../packages/functional'
import { useExpectSameValueReference } from '../packages/react-hooks'
import { InsetsConsumer } from '../packages/ui-insets'
import { GetLayoutPanelsStateContext, Layout, LayoutPanelContext } from '../packages/ui-layout'
import { useLayoutSlotRegistryContext } from '../packages/ui-layout-slots'
import { ResponsiveAppLayout } from '../packages/ui-responsive-app-layout'
import { ResponsiveStack } from '../packages/ui-responsive-stack'
import { ToggleMenuButton, ToggleSidebarButton } from '../packages/ui-toggle-buttons'
import { PANEL_CONTENT_NAME, PANEL_LEFT_NAME, PANEL_RIGHT_NAME, defaultContentProps, defaultPublicSidebarLeftProps, defaultPublicSidebarRightProps, sidebarLeftSlots, sidebarRightSlots } from './Constants'
import { Content } from './Content'
import { Sidebar } from './Sidebar'
import { SlotTargets } from './Slots'
import { CMSLayoutContentProps, CMSLayoutRootProps, OwnCMSLayoutSidebarProps } from './Types'

const {
	Content: ContentBody,
	ContentFooter,
	ContentHeader,
	Actions,
	Back,
	HeaderCenter,
	HeaderLeft,
	HeaderRight,
	Logo,
	ModalLogo,
	Navigation,
	Title,
	Sidebar: SidebarBody,
	SidebarLeftBody,
	SidebarLeftFooter,
	SidebarLeftHeader,
	SidebarRightBody,
	SidebarRightFooter,
	SidebarRightHeader,
	...notYetImplementedSlots
} = SlotTargets

if (import.meta.env.DEV) {
	const exhaustiveCheck: Record<string, never> = notYetImplementedSlots
}

export const Root = memo(({
	breakpoint,
	children,
	className,
	componentClassName = 'cms',
	contentProps: contentPropsProp = defaultContentProps,
	sidebarLeftProps: sidebarLeftPropsProp = defaultPublicSidebarLeftProps,
	sidebarRightProps: sidebarRightPropsProp = defaultPublicSidebarRightProps,
}: CMSLayoutRootProps) => {
	useExpectSameValueReference(sidebarLeftPropsProp)
	useExpectSameValueReference(sidebarRightPropsProp)

	const { activeSlots } = useLayoutSlotRegistryContext()

	const isSidebarLeftActive = useMemo(() => setHasOneOf(activeSlots, sidebarLeftSlots), [activeSlots])
	const isSidebarRightActive = useMemo(() => setHasOneOf(activeSlots, sidebarRightSlots), [activeSlots])

	const classNameFor = classNameForFactory(componentClassName, className)

	const classNameForSidebarLeft = classNameFor('sidebar-left')
	const classNameForSidebarRight = classNameFor('sidebar-right')
	const classNameForContent = classNameFor('content', stateClassName({
		[`${componentClassName}-sidebar-left-has-content`]: isSidebarLeftActive,
		[`${componentClassName}-sidebar-right-has-content`]: isSidebarRightActive,
	}))

	const sidebarLeftProps: OwnCMSLayoutSidebarProps = useMemo(() => mergeProps(
		defaultPublicSidebarLeftProps,
		{ className: classNameForSidebarLeft, panelName: PANEL_LEFT_NAME },
		sidebarLeftPropsProp ? sidebarLeftPropsProp : {},
	), [classNameForSidebarLeft, sidebarLeftPropsProp])

	const sidebarRightProps: OwnCMSLayoutSidebarProps = useMemo(() => mergeProps(
		defaultPublicSidebarRightProps,
		{ className: classNameForSidebarRight, panelName: PANEL_RIGHT_NAME },
		sidebarRightPropsProp ? sidebarRightPropsProp : {},
	), [classNameForSidebarRight, sidebarRightPropsProp])

	const contentProps: CMSLayoutContentProps = useMemo(() => mergeProps(
		defaultContentProps,
		{ className: classNameForContent, panelName: PANEL_CONTENT_NAME },
		contentPropsProp ? contentPropsProp : {},
	), [classNameForContent, contentPropsProp])

	return (
		<ResponsiveAppLayout
			className={classNameFor(null, stateClassName({
				'cms-content-has-max-width': typeof contentProps.maxWidth === 'number',
			}))}
			header={(
				<>
					<InsetsConsumer className={classNameFor('header-start')}>
						<Stack className={classNameFor('header-start-content')} align="center" justify="space-between" direction="horizontal">
							<Logo />
							<HeaderLeft />

							{sidebarLeftPropsProp && isSidebarLeftActive && !sidebarLeftPropsProp.keepVisible && (
								<GetLayoutPanelsStateContext.Consumer>{({ panels }) => (
									panels.get(PANEL_LEFT_NAME)?.behavior !== 'modal'
										? <ToggleSidebarButton
											className={classNameFor('toggle-left-sidebar')}
											panel={PANEL_LEFT_NAME}
											position="left"
										/>
										: null
								)}</GetLayoutPanelsStateContext.Consumer>
							)}
						</Stack>
					</InsetsConsumer>

					<InsetsConsumer className={classNameFor('header-main')}>
						<div className={classNameFor('header-main-content', classNameFor('content-container'))}>
							<ResponsiveStack
								align={useCallback((containerWidth: number) => containerWidth > breakpoint ? undefined : 'center', [breakpoint])}
								gap={useCallback((containerWidth: number) => containerWidth > breakpoint ? 'small' : 'default', [breakpoint])}
								direction={useCallback((containerWidth: number) => containerWidth > breakpoint ? 'vertical' : 'horizontal', [breakpoint])}
							>
								<Back className="cms-header-back" />
								<Title className="cms-header-title" />
							</ResponsiveStack>
							<HeaderCenter />
						</div>
					</InsetsConsumer>

					<InsetsConsumer className={classNameFor('header-end')}>
						<Stack className={classNameFor('header-end-content')} align="center" justify="space-between" direction="horizontal">
							{sidebarRightPropsProp && isSidebarRightActive && !sidebarRightPropsProp.keepVisible ? (
								<ToggleSidebarButton
									className={classNameFor('toggle-right-sidebar')}
									panel={PANEL_RIGHT_NAME}
									position="right"
								/>
							) : null}
							<HeaderRight />
							<Actions />

							<GetLayoutPanelsStateContext.Consumer>{({ panels }) => (
								panels.get(PANEL_LEFT_NAME)?.behavior === 'modal'
									? <ToggleMenuButton panel={PANEL_LEFT_NAME} />
									: null
							)}</GetLayoutPanelsStateContext.Consumer>
						</Stack>
					</InsetsConsumer>
				</>
			)}
		>
			{sidebarLeftPropsProp && isSidebarLeftActive && (
				<Sidebar {...sidebarLeftProps}>
					<Layout.PanelHeader className={classNameFor('sidebar-left-header')}>
						<Stack className={classNameFor('sidebar-left-header-content')} align="center" justify="space-between" direction="horizontal">
							<LayoutPanelContext.Consumer>{({ behavior }) => (
								behavior === 'modal' ? <ModalLogo className="synthetic-layout-slot" /> : null
							)}</LayoutPanelContext.Consumer>

							<SidebarLeftHeader />

							<LayoutPanelContext.Consumer>{({ behavior }) => (
								behavior === 'modal'
									? <ToggleMenuButton
										className={classNameFor('sidebar-left-header-menu-button')}
										panel={PANEL_LEFT_NAME}
									/>
									: null
							)}</LayoutPanelContext.Consumer>
						</Stack>
					</Layout.PanelHeader>

					<Layout.PanelBody className={classNameFor('sidebar-left-body')}>
						<Navigation />
						<SidebarLeftBody />
					</Layout.PanelBody>

					<Layout.PanelFooter className={classNameFor('sidebar-left-footer')}>
						<SidebarLeftFooter />
					</Layout.PanelFooter>
				</Sidebar>
			)}

			<Content {...contentProps}>
				<Layout.PanelHeader className={classNameFor('content-header')}>
					<ContentHeader />
				</Layout.PanelHeader>

				<Layout.PanelBody className={classNameFor('content-body')}>
					<div className={classNameFor('content-container')}>
						<ContentBody />
					</div>
				</Layout.PanelBody>

				<Layout.PanelFooter className={classNameFor('content-footer')}>
					<ContentFooter />
				</Layout.PanelFooter>
			</Content>

			{sidebarRightPropsProp && isSidebarRightActive && (
				<Sidebar {...sidebarRightProps}>
					<Layout.PanelHeader className={classNameFor('sidebar-right-header')}>
						<Stack className={classNameFor('sidebar-left-header-content')} align="center" justify="space-between" direction="horizontal">
							<SidebarRightHeader />
							<Spacer />
							<LayoutPanelContext.Consumer>{({ behavior }) => (
								behavior === 'modal'
									? <ToggleMenuButton
										className={classNameFor('sidebar-right-header-menu-button')}
										panel={PANEL_RIGHT_NAME}
									/>
									: null
							)}</LayoutPanelContext.Consumer>
						</Stack>
					</Layout.PanelHeader>

					<Layout.PanelBody className={classNameFor('sidebar-right-body')}>
						<SidebarBody />
						<SidebarRightBody />
					</Layout.PanelBody>

					<Layout.PanelFooter className={classNameFor('sidebar-right-footer')}>
						<SidebarRightFooter />
					</Layout.PanelFooter>
				</Sidebar>
			)}

			{children}
		</ResponsiveAppLayout>
	)
})
Root.displayName = 'CMSLayout.Root'
