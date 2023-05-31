import { Button, DevPanel, Link, LogoutLink, Stack, VisuallyHidden, visuallyHiddenStyle } from '@contember/admin'
import { Identity2023 } from '@contember/brand'
import { useDocumentTitle, useLayoutContainerWidth } from '@contember/layout'
import { LogOutIcon } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'
import { AlertLogoutLink } from './AlertLogoutLink'
import { LAYOUT_BREAKPOINT } from './Constants'
import { Directive, useDirectives } from './Directives'
import { LayoutType, Layouts } from './Layouts'
import { Navigation } from './Navigation'
import { Slots } from './Slots'

export const Layout = (props: PropsWithChildren) => {
	const directives = useDirectives()
	useDocumentTitle(directives.title)

	const LayoutComponent = Layouts[directives.layout] ?? Layouts.default
	const width = useLayoutContainerWidth()

	return (
		<>
			<Slots.Title>
				<h1>{directives.title}</h1>
			</Slots.Title>

			<Slots.Logo>
				<Link to="index">
					<Stack align="center" direction="horizontal" gap="small">
						<Identity2023.Edit scale={2} />
						<VisuallyHidden hidden={width < LAYOUT_BREAKPOINT}>Contember</VisuallyHidden>
					</Stack>
				</Link>
			</Slots.Logo>

			<Slots.Navigation>
				<Navigation />
			</Slots.Navigation>

			<Slots.Profile>
				<LogoutLink Component={AlertLogoutLink}>
					<Stack align="center" direction="horizontal" gap="small">
						<LogOutIcon /> Logout
					</Stack>
				</LogoutLink>
			</Slots.Profile>

			<LayoutComponent />

			{props.children}
		</>
	)
}

export const LayoutDevPanel = () => {
	const [typeState, setTypeState] = useState<LayoutType>()
	const [counter, setCounter] = useState(1)
	const { layout } = useDirectives()
	return (
		<>
			{typeState && <Directive name={'layout'} content={typeState} key={counter} />}
			<DevPanel heading={`Layout: ${layout}`}>
				{Object.keys(Layouts).map(key => (
					<Button key={key} onClick={() => {
						setTypeState(key as keyof typeof Layouts)
						setCounter(it => it + 1)
					}}>{key}</Button>
				))}
			</DevPanel>
		</>
	)
}
