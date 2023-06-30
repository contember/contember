import { LayoutKit, Slots, createLayoutBarComponent, createLayoutSidebarComponent } from '@contember/layout'
import { Divider, Spacer, Stack } from '@contember/ui'
import { pick } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { AppHeaderTitle } from '../AppHeaderTitle'
import { useDirectives } from '../Directives'
import { SlotTargets } from '../Slots'

const NAVIGATION_PANEL_NAME = 'navigation-panel'

const LayoutSlots = pick(SlotTargets, [
	'Back',
	'ContentFooter',
	'ContentHeader',
	'Actions',
	'HeaderCenter',
	'HeaderStart',
	'Logo',
	'Navigation',
	'Profile',
	'Sidebar',
	'Switchers',
	'Title',
])

const NavigationPanel = createLayoutSidebarComponent({
	defaultAs: 'aside',
	defaultBehavior: 'modal',
	defaultVisibility: 'hidden',
	displayName: 'NavigationPanel',
	name: NAVIGATION_PANEL_NAME,
})

const SubHeader = createLayoutBarComponent({
	defaultAs: 'div',
	displayName: 'SubHeader',
	name: 'sub-header',
})

export const Layout = ({ children, ...rest }: PropsWithChildren) => {
	const directives = useDirectives()
	const targetsIfActive = Slots.useTargetsIfActiveFactory(LayoutSlots)

	return (
		<LayoutKit.Frame
			header={
				<>
					<LayoutKit.Header
						start={targetsIfActive(['HeaderStart']) || false}
						center={targetsIfActive(['Logo', 'HeaderCenter'], (
							<>
								<Stack direction="horizontal">
									<SlotTargets.Logo />
								</Stack>
								<Spacer />
								<SlotTargets.HeaderCenter />
							</>
						))}
						end={state => (
							<>
								<SlotTargets.Profile />
								{state.panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal' && <LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />}
							</>
						)}
					/>
					<SubHeader
						start={targetsIfActive(['Back']) || false}
						center={<SlotTargets.Title as={AppHeaderTitle} />}
						end={targetsIfActive(['Actions'])}
					/>
				</>
			}
			footer={(
				<LayoutKit.Footer
					center={<p><small>Made by Contember &copy; {(new Date).getFullYear()}</small></p>}
					end={targetsIfActive(['Switchers'])}
				/>
			)}
			{...rest}
		>
			<LayoutKit.SidebarLeft
				keepVisible
				header={({ behavior }) => (behavior === 'modal' && (
					<>
						<Spacer />
						<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
					</>
				)) || false}
				body={targetsIfActive(['Navigation'])}
				footer={false}
			/>
			<Divider />
			<LayoutKit.ContentPanelMain
				header={targetsIfActive(['ContentHeader'])}
				body={(
					<>
						{children}
						<SlotTargets.Sidebar />
					</>)}
				footer={targetsIfActive(['ContentFooter'])}
				maxWidth={directives?.['content-max-width']}
			/>
		</LayoutKit.Frame>
	)
}
Layout.displayName = 'Layout(default-layout)'
