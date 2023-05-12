import { Spacer, Stack } from '@contember/admin'
import { GetLayoutPanelsStateContext, InsetsConsumer, Layout, LayoutPanelContext, ResponsiveAppLayout, ResponsiveStack, ToggleMenuButton, ToggleSidebarButton, useLayoutSlotRegistryContext } from '@contember/layout'
import { useExpectSameValueReference } from '@contember/react-utils'
import { dataAttribute, setHasOneOf, useClassNameFactory } from '@contember/utilities'
import { mergeProps } from '@react-aria/utils'
import { memo, useCallback, useMemo } from 'react'
import { PANEL_CONTENT_NAME, PANEL_LEFT_NAME, PANEL_RIGHT_NAME, defaultContentProps, defaultPublicSidebarLeftProps, defaultPublicSidebarRightProps, sidebarLeftSlots, sidebarRightSlots } from './Constants'
import { Content } from './Content'
import { Sidebar } from './Sidebar'
import { SlotTargets, slotTargets } from './Slots'
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

	const classNameFor = useClassNameFactory(componentClassName, undefined)

	const classNameForSidebarLeft = classNameFor('sidebar-left')
	const classNameForSidebarRight = classNameFor('sidebar-right')
	const classNameForContent = classNameFor('content')

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
		{
			className: classNameForContent,
			panelName: PANEL_CONTENT_NAME,
		},
		contentPropsProp ? contentPropsProp : {},
	), [classNameForContent, contentPropsProp])

	const gapAtContainerWidth = useCallback((containerWidth: number) => containerWidth > breakpoint ? 'small' : 'default', [breakpoint])

	return (
		<ResponsiveAppLayout
			className={classNameFor(null, className)}
			data-content-has-max-width={dataAttribute(typeof contentProps.maxWidth === 'number')}
			data-sidebar-left-has-content={dataAttribute(isSidebarLeftActive)}
			data-sidebar-right-has-content={dataAttribute(isSidebarRightActive)}
			header={(
				<GetLayoutPanelsStateContext.Consumer>
					{({ panels }) => {
						const toggleSidebarLeftButtonIsVisible: boolean = sidebarLeftPropsProp && isSidebarLeftActive && !sidebarLeftPropsProp.keepVisible && panels.get(PANEL_LEFT_NAME)?.behavior !== 'modal'
						const toggleSidebarRightButtonIsVisible: boolean = sidebarRightPropsProp && isSidebarRightActive && !sidebarRightPropsProp.keepVisible
						const toggleMenuButtonIsVisible: boolean = panels.get(PANEL_LEFT_NAME)?.behavior === 'modal'

						return (
							<>
								{(setHasOneOf(activeSlots, [slotTargets.HeaderLeft, slotTargets.Logo]) || toggleSidebarLeftButtonIsVisible) && (
									<InsetsConsumer className={classNameFor('header-start')}>
										<Stack className={classNameFor('header-start-content')} align="center" justify="space-between" direction="horizontal">
											<Logo />
											<HeaderLeft />

											{toggleSidebarLeftButtonIsVisible && (
												<ToggleSidebarButton
													className={classNameFor('toggle-left-sidebar')}
													panel={PANEL_LEFT_NAME}
													position="left"
												/>
											)}
										</Stack>
									</InsetsConsumer>
								)}

								<InsetsConsumer className={classNameFor('header-main')}>
									<div className={classNameFor('header-main-content', classNameFor('content-container'))}>
										<ResponsiveStack
											align="center"
											direction="horizontal"
											gap={gapAtContainerWidth}
										>
											<Back className="cms-header-back" />
											<Title className="cms-header-title" />
										</ResponsiveStack>
										<HeaderCenter />
									</div>
								</InsetsConsumer>

								{(setHasOneOf(activeSlots, [slotTargets.Actions, slotTargets.HeaderRight]) || toggleMenuButtonIsVisible || toggleSidebarRightButtonIsVisible) && (
									<InsetsConsumer className={classNameFor('header-end')}>
										<Stack className={classNameFor('header-end-content')} align="center" justify="space-between" direction="horizontal">
											{toggleSidebarRightButtonIsVisible && (
												<ToggleSidebarButton
													className={classNameFor('toggle-right-sidebar')}
													panel={PANEL_RIGHT_NAME}
													position="right"
												/>
											)}
											<HeaderRight />
											<Actions />
											{toggleMenuButtonIsVisible && <ToggleMenuButton panel={PANEL_LEFT_NAME} />}
										</Stack>
									</InsetsConsumer>
								)}
							</>
						)
					}}
				</GetLayoutPanelsStateContext.Consumer>
			)}
		>
			{sidebarLeftPropsProp && isSidebarLeftActive && (
				<Sidebar {...sidebarLeftProps}>
					{setHasOneOf(activeSlots, [slotTargets.SidebarLeftHeader]) && (
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
					)}

					<Layout.PanelBody className={classNameFor('sidebar-left-body')}>
						<Navigation />
						<SidebarLeftBody />
					</Layout.PanelBody>

					{setHasOneOf(activeSlots, [slotTargets.SidebarLeftFooter]) && (
						<Layout.PanelFooter className={classNameFor('sidebar-left-footer')}>
							<SidebarLeftFooter />
						</Layout.PanelFooter>
					)}
				</Sidebar>
			)}

			<Content {...contentProps}>
				{setHasOneOf(activeSlots, [slotTargets.ContentHeader]) && (
					<Layout.PanelHeader className={classNameFor('content-header')}>
						<ContentHeader />
					</Layout.PanelHeader>
				)}

				<Layout.PanelBody className={classNameFor('content-body')}>
					<div className={classNameFor('content-container')}>
						<ContentBody />
					</div>
				</Layout.PanelBody>

				{setHasOneOf(activeSlots, [slotTargets.ContentFooter]) && (
					<Layout.PanelFooter className={classNameFor('content-footer')}>
						<ContentFooter />
					</Layout.PanelFooter>
				)}
			</Content>

			{sidebarRightPropsProp && isSidebarRightActive && (
				<Sidebar {...sidebarRightProps}>
					{setHasOneOf(activeSlots, [slotTargets.SidebarRightHeader]) && (
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
					)}

					{setHasOneOf(activeSlots, [slotTargets.Sidebar, slotTargets.SidebarRightBody]) && (
						<Layout.PanelBody className={classNameFor('sidebar-right-body')}>
							<SidebarBody />
							<SidebarRightBody />
						</Layout.PanelBody>
					)}

					{setHasOneOf(activeSlots, [slotTargets.SidebarRightFooter]) && (
						<Layout.PanelFooter className={classNameFor('sidebar-right-footer')}>
							<SidebarRightFooter />
						</Layout.PanelFooter>
					)}
				</Sidebar>
			)}

			{children}
		</ResponsiveAppLayout>
	)
})
Root.displayName = 'CMSLayout.Root'
