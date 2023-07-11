import { Divider, Spacer, Stack } from '@contember/admin'
import { LayoutKit, LayoutPrimitives, Slots, commonSlots, contentSlots, footerSlots, headerSlots } from '@contember/layout'
import { useClassName } from '@contember/react-utils'
import { pick } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { useDirectives } from '../Directives'
import { SlotTargets } from '../Slots'

const slotsInSidebarLeft = ['Navigation', 'Profile', 'SidebarLeftBody', 'SidebarLeftFooter', 'SidebarLeftHeader', 'Switchers'] as const
const slotsInSidebarRight = ['SidebarRightHeader', 'Sidebar', 'SidebarRightFooter'] as const

export const SidebarLeftSlots = pick(SlotTargets, slotsInSidebarLeft)
export const SidebarRightSlots = pick(SlotTargets, slotsInSidebarRight)
export const LayoutSlots = pick(SlotTargets, [...commonSlots, ...headerSlots, ...footerSlots, ...contentSlots, ...slotsInSidebarLeft, ...slotsInSidebarRight] as const)

export const Layout = ({ children, ...rest }: PropsWithChildren) => {
	const directives = useDirectives()
	const hasActiveSlots = Slots.useHasActiveSlotsFactory(LayoutSlots)
	const targetsIfActive = Slots.useTargetsIfActiveFactory(LayoutSlots)

	const isSidebarLeftActive = hasActiveSlots(...slotsInSidebarLeft)
	const isSidebarRightActive = hasActiveSlots(...slotsInSidebarRight)

	return (
		<LayoutKit.Frame
			header={
				<LayoutKit.Header
					start={targetsIfActive(['Logo', 'HeaderStart'])}
					startAfter={({ panels }) =>
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior !== 'modal' && (
							<LayoutKit.ToggleSidebarButton panelName={LayoutKit.SidebarLeft.NAME} position="left" />
						)
					}
					center={(
						<>
							<Stack align="center" direction="horizontal" gap="default">
								<LayoutSlots.Back />
								<LayoutSlots.Title as="h1" />
							</Stack>
							<LayoutSlots.HeaderCenter />
						</>
					)}
					endBefore={(
						<LayoutKit.ToggleSidebarButton
							className={useClassName('toggle-right-sidebar')}
							panelName={LayoutKit.SidebarRight.NAME}
							position="right"
						/>
					)}
					end={targetsIfActive(['HeaderEnd', 'Actions'])}
					endAfter={({ panels }) =>
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal' && (
							<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
						)
					}
				/>
			}
			footer={(
				<LayoutKit.Footer
					start={targetsIfActive(['FooterStart'])}
					center={targetsIfActive(['FooterCenter'])}
					end={targetsIfActive(['FooterEnd'])}
				/>
			)}
			{...rest}
		>
			{isSidebarLeftActive && (
				<>
					<LayoutKit.SidebarLeft
						header={({ behavior }) => (
							<>
								<LayoutSlots.SidebarLeftHeader />
								<LayoutSlots.Switchers />
								<Spacer />
								{behavior === 'modal' && (
									<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
								)}
							</>
						)}
						body={targetsIfActive(['Navigation', 'SidebarLeftBody'])}
						footer={targetsIfActive(['SidebarLeftFooter', 'Profile'])}
					/>
					<LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>{({ panels }) => {
						const panel = panels.get(LayoutKit.SidebarLeft.NAME)

						return panel?.behavior === 'static' && panel?.visibility === 'visible' && (
							<Divider />
						)
					}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
				</>
			)}
			<LayoutKit.ContentPanelMain
				header={targetsIfActive(['ContentHeader'])}
				body={children}
				footer={targetsIfActive(['ContentFooter'])}
				maxWidth={directives['content-max-width']}
			/>
			{isSidebarRightActive && (
				<>
					<LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>{({ panels }) => {
						const panel = panels.get(LayoutKit.SidebarRight.NAME)

						return panel?.behavior === 'static' && panel?.visibility === 'visible' && (
							<Divider />
						)
					}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
					<LayoutKit.SidebarRight
						header={({ behavior }) => (
							<>
								{targetsIfActive(['SidebarRightHeader'], (
									<>
										<LayoutSlots.SidebarRightHeader />
										<Spacer />
									</>
								))}
								{(behavior === 'modal' && <LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarRight.NAME} />)}
							</>
						)}
						body={targetsIfActive(['Sidebar'])}
						footer={targetsIfActive(['SidebarRightFooter'])}
					/>
				</>
			)}
		</LayoutKit.Frame>
	)
}
Layout.displayName = 'Layout(cms-layout)'
