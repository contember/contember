import { LayoutKit, Slots, createLayoutBarComponent } from '@contember/layout'
import { Spacer } from '@contember/ui'
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

export interface LayoutComponentProps extends ComponentClassNameProps { }

export const LayoutComponent = ({ children, ...rest }: PropsWithChildren<LayoutComponentProps>) => {
	const directives = useDirectives()
	const createSlotTargets = Slots.useSlotTargetsFactory(SlotTargets)

	return (
		<LayoutKit.Frame
			header={
				<>
					<LayoutKit.Header
						start={createSlotTargets(['Logo', 'HeaderStart']) || false}
						center={state => (
							state.panels.get(LayoutKit.SidebarLeft.NAME)?.behavior === 'modal'
								? createSlotTargets(['HeaderCenter'])
								: createSlotTargets(['Navigation', 'HeaderCenter'])
						) || false}
						centerAfter={state => state.panels.get(LayoutKit.SidebarLeft.NAME)?.behavior !== 'modal' && <Spacer grow gap={false} /> || false}
						centerBefore={state => state.panels.get(LayoutKit.SidebarLeft.NAME)?.behavior !== 'modal' && <Spacer grow gap={false} /> || false}
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
						center={<SlotTargets.Title as={AppHeaderTitle} />}
						end={createSlotTargets(['Actions']) || false}
					/>
				</>
			}
			footer={(
				<LayoutKit.Footer
					start={createSlotTargets(['FooterStart']) || false}
					center={createSlotTargets(['FooterCenter']) || false}
					end={createSlotTargets(['FooterEnd', 'Switchers']) || false}
				/>
			)}
			{...rest}
		>
			<LayoutKit.SidebarLeft
				header={({ behavior }) => (behavior === 'modal'
					? (
						<>
							<SlotTargets.SidebarLeftHeader />
							<Spacer />
							<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarLeft.NAME} />
						</>
					)
					: createSlotTargets(['SidebarLeftHeader'])
				) || false}
				body={({ behavior }) => (behavior === 'modal'
					? createSlotTargets(['Navigation', 'SidebarLeftBody'])
					: createSlotTargets(['SidebarLeftBody'])
				) || false}
				footer={createSlotTargets(['SidebarLeftFooter']) || false}
				onBehaviorChange={state => {
					if (state.behavior === 'static') {
						return { visibility: 'hidden' }
					}
				}}
			/>
			<PanelDivider name={LayoutKit.SidebarLeft.NAME} />
			<LayoutKit.ContentPanelMain
				header={(_, state) => state.panels.get?.(LayoutKit.SidebarRight.NAME)?.visibility === 'hidden'
					? (
						<>
							{createSlotTargets(['ContentHeader'])}
							<Spacer grow />
							<LayoutKit.ToggleSidebarButton panelName={LayoutKit.SidebarRight.NAME} position="right" />
						</>
					)
					: createSlotTargets(['ContentHeader']) || false
				}
				body={(
					<>
						{children}
						<SlotTargets.Sidebar />
					</>)}
				footer={createSlotTargets(['ContentFooter'])}
				maxWidth={directives?.['content-max-width']}
				priority={0}
			/>
			<PanelDivider name={LayoutKit.SidebarRight.NAME} />
			{createSlotTargets(['SidebarRightHeader', 'Sidebar', 'SidebarRightBody', 'SidebarRightFooter'], (
				<LayoutKit.SidebarRight
					maxWidth={480}
					header={(
						<>
							{createSlotTargets(['SidebarRightHeader'])}
							<Spacer grow />
							<LayoutKit.ToggleMenuButton panelName={LayoutKit.SidebarRight.NAME} />
						</>
					)}
					body={createSlotTargets(['Sidebar', 'SidebarRightBody']) || false}
					footer={createSlotTargets(['SidebarRightFooter']) || false}
					onBehaviorChange={() => ({ visibility: 'visible', passive: false })}
				/>
			))}
		</LayoutKit.Frame>
	)
}
LayoutComponent.displayName = 'LayoutComponent[default]'
