import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Directive, useDirectives } from './Directives'
import * as Layouts from './Layouts'
import { TitleSlot } from './Slots'
import { Button, DevPanel } from '@contember/admin'

const types = Object.keys(Layouts) as ReadonlyArray<keyof typeof Layouts>
export type LayoutTypes = typeof types[number]

export const BREAKPOINT = 768


export const Layout = (props: {
	children?: ReactNode;
}) => {
	const initialTitle = useMemo(() => document.title, [])

	const { layout, title } = useDirectives()
	const LayoutComponent = Layouts[layout ?? 'default']
	useEffect(() => {
		if (title) {
			document.title = `${title} / ${initialTitle}`
		} else {
			document.title = initialTitle
		}
	}, [initialTitle, title])

	return (
		<>
			<TitleSlot><h1>{title}</h1></TitleSlot>
			<LayoutComponent />
			{props.children}
		</>
	)
}

export const LayoutDevPanel = () => {
	const [typeState, setTypeState] = useState<LayoutTypes>()
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

Layout.types = types
Layout.breakpoint = BREAKPOINT
