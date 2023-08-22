import { Spacer, Stack } from '@contember/admin'
import { LayoutKit, LayoutPrimitives, Slots } from '@contember/layout'
import { PropsWithChildren } from 'react'
import { useDirectives } from './Directives'
import { PanelDivider } from './PanelDivider'
import { SlotTargets } from './Slots'

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren) => {
	const directives = useDirectives()
	const createSlotTargets = Slots.useCreateSlotTargetsWhenActiveFactory(SlotTargets)

	return (
		<LayoutKit.Frame
			header={
				<LayoutKit.Header
					start={createSlotTargets(['HeaderStart', 'Logo'])}
					startBefore={({ panels }) => (
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
							? false
							: <LayoutKit.ToggleSidebarButton panelName={LayoutKit.SidebarLeft.NAME} position="left" />
					)}
					center={createSlotTargets(['HeaderCenter'])}
					end={({ panels }) => (
						panels.get(LayoutKit.SidebarLeft.NAME)?.behavior !== 'modal'
							? createSlotTargets(['Actions', 'HeaderEnd']) || false
							: createSlotTargets(['HeaderEnd']) || false
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
					start={createSlotTargets(['FooterStart']) || false}
					center={createSlotTargets(['FooterCenter']) || false}
					end={createSlotTargets(['Switchers', 'FooterEnd']) || false}
				/>
			)}
			{...rest}
		>
			{createSlotTargets(['Navigation', 'Profile'], (
				<LayoutKit.SidebarLeft
					keepVisible
					header={(({ behavior }) => behavior === 'modal'
						? (
							<>
								<SlotTargets.SidebarLeftHeader />
								<Spacer />
								<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
							</>
						)
						: createSlotTargets(['SidebarLeftHeader'])
					) || false}
					body={createSlotTargets(['Navigation', 'SidebarLeftBody']) || false}
					footer={createSlotTargets(['Profile', 'SidebarLeftFooter']) || false}
				/>
			))}

			<PanelDivider name={LayoutKit.SidebarLeft.NAME} />

			<LayoutKit.ContentPanelMain
				header={(_, { panels }) => (
					panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
						? createSlotTargets(['ContentHeader', 'Back', 'Title', 'Actions'], (
							<>
								<Stack align="center" horizontal>
									<SlotTargets.Back />
									<SlotTargets.Title as="h1" />
								</Stack>
								<Spacer grow />
								{createSlotTargets(['ContentHeader', 'Actions'])}
							</>
						))
						: createSlotTargets(['ContentHeader', 'Back', 'Title'], (
							<>
								<Stack align="center" horizontal>
									<SlotTargets.Back />
									<SlotTargets.Title as="h1" />
								</Stack>
								{createSlotTargets(['ContentHeader'])}
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
									<SlotTargets.Sidebar />
								)}
							</>
						)
					}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
				)}
				footer={createSlotTargets(['ContentFooter']) || false}
				maxWidth={directives['content-max-width']}
			/>

			<PanelDivider name={LayoutKit.SidebarRight.NAME} />

			{createSlotTargets(['Sidebar'], (
				<LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>{({ panels }) => {
					const leftPanel = panels.get(LayoutKit.SidebarLeft.NAME)

					return (
						leftPanel?.behavior !== 'modal'
							? (
								<LayoutKit.SidebarRight
									keepVisible
									header={createSlotTargets(['SidebarRightHeader']) || false}
									body={createSlotTargets(['Sidebar', 'SidebarRightBody'], (
										<Slots.Target name="Sidebar" aliases={['SidebarRightBody']} />
									)) || false}
									footer={createSlotTargets(['SidebarRightFooter']) || false}
								/>
							)
							: null
					)
				}}</LayoutPrimitives.GetLayoutPanelsStateContext.Consumer>
			))}
		</LayoutKit.Frame>
	)
}
LayoutComponent.displayName = 'Layout(headless-cms)'
