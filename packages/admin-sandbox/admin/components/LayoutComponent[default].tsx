import { LayoutKit, Slots, createLayoutBarComponent } from '@contember/layout'
import { Divider, Spacer, Stack } from '@contember/ui'
import { ComponentClassNameProps } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { AppHeaderTitle } from './AppHeaderTitle'
import { useDirectives } from './Directives'
import { PanelDivider } from './PanelDivider'
import { SlotTargets } from './Slots'

const SubHeader = createLayoutBarComponent({
	defaultAs: 'div',
	displayName: 'SubHeader',
	name: 'sub-header',
})

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren<ComponentClassNameProps>) => {
	const directives = useDirectives()
	const createSlotTargets = Slots.useCreateSlotTargetsWhenActiveFactory(SlotTargets)

	return (
		<LayoutKit.Frame
			header={
				<>
					<LayoutKit.Header
						start={createSlotTargets(['Logo', 'HeaderStart']) || false}
						center={createSlotTargets(['HeaderCenter']) || false}
						end={state => {
							const targets = createSlotTargets(['HeaderEnd', 'Profile'])
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
						start={createSlotTargets(['Back']) || false}
						center={<SlotTargets.Title as={AppHeaderTitle} fallback={<AppHeaderTitle.Fallback />} />}
						end={createSlotTargets(['Actions']) || false}
					/>
				</>
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
				footer={createSlotTargets(['SidebarLeftFooter']) || false}
			/>

			<PanelDivider name={LayoutKit.SidebarLeft.NAME} />

			<LayoutKit.ContentPanelMain
				header={createSlotTargets(['ContentHeader'])}
				body={(
					<>
						{children}
						<SlotTargets.SidebarRightHeader />
						<SlotTargets.Sidebar />
						<SlotTargets.SidebarRightBody />
						<SlotTargets.SidebarRightFooter />
					</>)}
				footer={createSlotTargets(['ContentFooter'])}
				maxWidth={directives?.['content-max-width']}
			/>
		</LayoutKit.Frame>
	)
}
LayoutComponent.displayName = 'Layout(default)'
