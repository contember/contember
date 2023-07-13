import { Spacer, Stack } from '@contember/admin'
import { LayoutKit, LayoutPrimitives, Slots, commonSlots, contentSlots, footerSlots, headerSlots } from '@contember/layout'
import { pick } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { useDirectives } from './Directives'
import { PanelDivider } from './PanelDivider'
import { SlotTargets } from './Slots'

export const LayoutSlots = pick(SlotTargets, [...commonSlots, ...headerSlots, ...footerSlots, ...contentSlots] as const)

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren) => {
	const directives = useDirectives()
	const targetsIfActive = Slots.useTargetsIfActiveFactory(LayoutSlots)

	return (
		<LayoutKit.Frame
			header={
				<LayoutKit.Header
					start={targetsIfActive(['Logo', 'HeaderStart'])}
					startBefore={({ panels }) => (
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
							? false
							: <LayoutKit.ToggleSidebarButton panelName={LayoutKit.SidebarLeft.NAME} position="left" />
					)}
					center={targetsIfActive(['HeaderCenter'])}
					end={({ panels }) => (
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior !== 'modal'
							? targetsIfActive(['HeaderEnd', 'Actions']) || false
							: targetsIfActive(['HeaderEnd']) || false
					)}
					endAfter={({ panels }) => (
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
							? <LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
							: <LayoutKit.ToggleSidebarButton panelName={LayoutKit.SidebarRight.NAME} position="right" />
					)}
				/>
			}
			footer={(
				<LayoutKit.Footer
					start={targetsIfActive(['FooterStart']) || false}
					center={targetsIfActive(['FooterCenter', 'Switchers']) || false}
					end={targetsIfActive(['FooterEnd']) || false}
				/>
			)}
			{...rest}
		>
			{targetsIfActive(['Navigation', 'Profile'], (
				<LayoutKit.SidebarLeft
					header={({ behavior }) => behavior === 'modal'
						? (
							<>
								<Spacer />
								<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
							</>
						)
						: false
					}
					body={targetsIfActive(['Navigation']) || false}
					footer={targetsIfActive(['Profile']) || false}
				/>
			))}

			<PanelDivider name={LayoutKit.SidebarLeft.NAME} />

			<LayoutKit.ContentPanelMain
				header={(_, { panels }) => (
					panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
						? targetsIfActive(['ContentHeader', 'Back', 'Title', 'Actions'], (
							<>
								<Stack align="center" direction="horizontal">
									<LayoutSlots.Back />
									<LayoutSlots.Title as="h1" />
								</Stack>
								<Spacer grow />
								{targetsIfActive(['ContentHeader'])}
								{targetsIfActive(['Actions'])}
							</>
						))
						: targetsIfActive(['ContentHeader', 'Back', 'Title'], (
							<>
								<Stack align="center" direction="horizontal">
									<LayoutSlots.Back />
									<LayoutSlots.Title as="h1" />
								</Stack>
								{targetsIfActive(['ContentHeader'])}
							</>
						))
				)}
				body={(
					<LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>{({ panels }) => {
						const leftPanel = panels.get(LayoutKit.SidebarLeft.NAME)

						return (
							<>
								{children}
								{leftPanel?.behavior === 'modal' && (
									<LayoutSlots.Sidebar />
								)}
							</>
						)
					}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
				)}
				footer={targetsIfActive(['ContentFooter']) || false}
				maxWidth={directives['content-max-width']}
			/>

			<PanelDivider name={LayoutKit.SidebarRight.NAME} />

			{targetsIfActive(['Sidebar'], (
				<LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>{({ panels }) => {
					const leftPanel = panels.get(LayoutKit.SidebarLeft.NAME)

					return (
						leftPanel?.behavior !== 'modal'
							? <LayoutKit.SidebarRight
								header={false}
								body={targetsIfActive(['Sidebar']) || false}
								footer={false}
							/>
							: null
					)
				}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
			))}
		</LayoutKit.Frame>
	)
}
LayoutComponent.displayName = 'Layout(headless-cms)'
