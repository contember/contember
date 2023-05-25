import { Button, DevPanel, Link, Stack } from '@contember/admin'
import { Identity2023 } from '@contember/brand'
import { useDocumentTitle } from '@contember/layout'
import { PropsWithChildren, useState } from 'react'
import { Directive, useDirectives } from './Directives'
import { LayoutType, Layouts } from './Layouts'
import { Navigation } from './Navigation'
import { Slots } from './Slots'

export const Layout = (props: PropsWithChildren) => {
	const directives = useDirectives()
	useDocumentTitle(directives.title)

	const LayoutComponent = Layouts[directives.layout ?? 'default']

	return (
		<>
			<Slots.Title>
				<h1>{directives.title}</h1>
			</Slots.Title>

			<Slots.Logo>
				<Link to="index">
					<Stack align="center" direction="horizontal" gap="small">
						<Identity2023.Edit scale={2} /> Contember
					</Stack>
				</Link>
			</Slots.Logo>

			<Slots.Navigation>
				<Navigation />
			</Slots.Navigation>

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
