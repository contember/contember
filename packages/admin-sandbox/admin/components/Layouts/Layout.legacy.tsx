import { CommonSlotTargets, ContentSlotTargets } from '@contember/layout'
import { Layout as DefaultLayout, LayoutPage } from '@contember/ui'
import { NestedClassName, useClassName } from '@contember/utilities'
import { PropsWithChildren } from 'react'

const {
	Actions,
	Logo,
	Navigation,
	Sidebar,
	Title,
	Switchers,
	Back,
	Profile,
	...rest
} = CommonSlotTargets

const AfterTitle = ContentSlotTargets.ContentHeader

if (import.meta.env.DEV) {
	const __exhaustiveCheck: Record<PropertyKey, never> = rest
}

export const Layout = ({
	children,
	className,
	...rest
}: PropsWithChildren<{
	className?: NestedClassName;
}>) => (
	<DefaultLayout
		className={useClassName(undefined, className)}
		sidebarHeader={<Logo />}
		switchers={<Switchers />}
		navigation={<Navigation />}
		children={(
			<LayoutPage
				navigation={<Back />}
				actions={<Actions />}
				side={<Sidebar />}
				title={<Title as="h1" />}
				afterTitle={<AfterTitle />}
			>
				{children}
			</LayoutPage>
		)}
		sidebarFooter={<Profile />}
		{...rest}
	/>
)
