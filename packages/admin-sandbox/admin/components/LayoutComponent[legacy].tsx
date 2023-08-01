import { CommonSlotTargets, Slots } from '@contember/layout'
import { useClassName } from '@contember/react-utils'
import { Layout as DefaultLayout, LayoutPage, Spacer } from '@contember/ui'
import { NestedClassName } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { SlotSources, SlotTargets } from './Slots'

const {
	Actions,
	Back,
	ContentFooter,
	ContentHeader,
	FooterCenter,
	FooterEnd,
	FooterStart,
	HeaderCenter,
	HeaderEnd,
	HeaderStart,
	Logo,
	Navigation,
	Profile,
	Sidebar,
	Switchers,
	Title,
	...rest
} = SlotTargets

if (import.meta.env.DEV) {
	const __exhaustiveCheck: Record<PropertyKey, never> = rest
}

export const LayoutComponent = ({
	children,
	className,
	...rest
}: PropsWithChildren<{
	className?: NestedClassName;
}>) => {
	const targetsIfActive = Slots.useTargetsIfActiveFactory(SlotTargets)

	return (
		<DefaultLayout
			className={useClassName(undefined, className)}
			sidebarHeader={targetsIfActive(['Logo'])}
			switchers={targetsIfActive(['Switchers'])}
			navigation={targetsIfActive(['Navigation'])}
			children={(
				<>
					{targetsIfActive(['HeaderStart', 'HeaderCenter', 'HeaderEnd'], (
						<header>
							<HeaderStart />
							<HeaderCenter />
							<HeaderEnd />
						</header>
					))}
					<LayoutPage
						navigation={targetsIfActive(['Back'])}
						actions={targetsIfActive(['Actions'])}
						side={targetsIfActive(['Sidebar'])}
						title={targetsIfActive(['Title'], (
							<Title as="h1" />
						))}
						afterTitle={targetsIfActive(['ContentHeader'])}
					>
						{children}
						<Spacer grow />
						{targetsIfActive(['FooterStart', 'FooterCenter', 'FooterEnd'], (
							<footer>
								<FooterStart />
								<FooterCenter />
								<FooterEnd />
							</footer>
						))}
						{targetsIfActive(['ContentFooter'])}
					</LayoutPage>
				</>
			)}
			sidebarFooter={targetsIfActive(['Profile'])}
			{...rest}
		/>
	)
}
LayoutComponent.displayName = 'LayoutComponent'
