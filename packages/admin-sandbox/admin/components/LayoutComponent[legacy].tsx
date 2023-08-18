import { Slots } from '@contember/layout'
import { useClassName } from '@contember/react-utils'
import { Layout as DefaultLayout, LayoutPage, Spacer, Stack } from '@contember/ui'
import { NestedClassName } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { SlotTargets } from './Slots'

export const LayoutComponent = ({
	children,
	className,
	...rest
}: PropsWithChildren<{
	className?: NestedClassName;
}>) => {
	const createSlotTargets = Slots.useCreateSlotTargetsWhenActiveFactory(SlotTargets)

	return (
		<DefaultLayout
			className={useClassName(undefined, className)}
			sidebarHeader={createSlotTargets(['SidebarLeftHeader', 'Logo'])}
			switchers={createSlotTargets(['Switchers'])}
			navigation={createSlotTargets(['Navigation'])}
			children={(
				<>
					<LayoutPage
						navigation={createSlotTargets(['Back'])}
						actions={createSlotTargets(['Actions', 'HeaderEnd'])}
						side={createSlotTargets(['SidebarRightHeader', 'Sidebar', 'SidebarRightBody', 'SidebarRightFooter'])}
						title={createSlotTargets(['HeaderStart', 'Title', 'HeaderCenter'], (
							<>
								{createSlotTargets(['HeaderStart'])}
								{createSlotTargets(['Title', 'HeaderCenter'], (
									<>
										<SlotTargets.Title as="h1" />
										<SlotTargets.HeaderCenter />
									</>
								))}
							</>
						))}
						afterTitle={createSlotTargets(['ContentHeader'])}
					>
						{children}
						<Spacer grow />
						{createSlotTargets(['ContentFooter'])}
						{createSlotTargets(['FooterStart', 'FooterCenter', 'FooterEnd'], (
							<Stack horizontal>
								<SlotTargets.FooterStart />
								<SlotTargets.FooterCenter />
								<SlotTargets.FooterEnd />
							</Stack>
						))}
					</LayoutPage>
				</>
			)}
			sidebarFooter={createSlotTargets(['Profile', 'SidebarLeftFooter'])}
			{...rest}
		/>
	)
}
LayoutComponent.displayName = 'LayoutComponent'
