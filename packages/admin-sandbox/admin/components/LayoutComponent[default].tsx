import { LayoutKit, Slots, createLayoutBarComponent } from '@contember/layout'
import { Divider, Spacer, Stack } from '@contember/ui'
import { ComponentClassNameProps, pick } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { AppHeaderTitle } from './AppHeaderTitle'
import { useDirectives } from './Directives'
import { PanelDivider } from './PanelDivider'
import { SlotTargets } from './Slots'

const LayoutSlots = pick(SlotTargets, [
	'Back',
	'ContentFooter',
	'ContentHeader',
	'Actions',
	'HeaderCenter',
	'HeaderStart',
	'HeaderEnd',
	'FooterStart',
	'FooterCenter',
	'FooterEnd',
	'Logo',
	'Navigation',
	'Profile',
	'Sidebar',
	'Switchers',
	'Title',
])

const SubHeader = createLayoutBarComponent({
	defaultAs: 'div',
	displayName: 'SubHeader',
	name: 'sub-header',
})

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren<ComponentClassNameProps>) => {
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
						)) || false}
						end={state => {
							const targets = targetsIfActive(['HeaderEnd', 'Profile'])
							const menuButton = state.panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
								? < LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
								: null

							return (targets || menuButton)
								? (
									<>
										{targets}
										{menuButton}
									</>
								)
								: false
						}}
					/>
					<SubHeader
						start={targetsIfActive(['Back']) || false}
						center={<SlotTargets.Title as={AppHeaderTitle} />}
						end={targetsIfActive(['Actions']) || false}
					/>
				</>
			}
			footer={(
				<LayoutKit.Footer
					start={targetsIfActive(['FooterStart']) || false}
					center={targetsIfActive(['FooterCenter']) || false}
					end={targetsIfActive(['FooterEnd', 'Switchers']) || false}
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
				body={targetsIfActive(['Navigation']) || false}
				footer={false}
			/>
			<PanelDivider name={LayoutKit.SidebarLeft.NAME} />
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
LayoutComponent.displayName = 'Layout(default)'
