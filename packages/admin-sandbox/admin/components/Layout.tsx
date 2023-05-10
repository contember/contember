import { useReferentiallyStableCallback } from '@contember/react-utils'
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { DirectivesConsumer } from './Directives'
import * as Layouts from './Layouts'
import { TitleSlot } from './Slots'

const types = Object.keys(Layouts) as ReadonlyArray<keyof typeof Layouts>
type LayoutTypes = typeof types[number]

export const BREAKPOINT = 768

export const Layout = (props: {
	type?: LayoutTypes,
	children?: ReactNode;
}) => {
	const [typeState, setTypeState] = useState(props.type)
	const documentTitle = useRef(document.title)

	useEffect(() => () => {
		document.title = documentTitle.current
	}, [])

	return (
		<>
			<DirectivesConsumer>{({ layout, title }) => {
				const LayoutComponent = Layouts[typeState ?? layout] ?? Layouts.default

				if (title) {
					if (document.title !== title) {
						document.title = `${title} / ${documentTitle.current}`
					}
				} else {
					document.title = documentTitle.current
				}

				return (
					<>
						<TitleSlot><h1>{title}</h1></TitleSlot>
						<LayoutComponent />
					</>
				)
			}}</DirectivesConsumer>
			{props.children}
			<div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 1000 }}>
				<select value={typeState} onChange={useReferentiallyStableCallback((e: ChangeEvent<HTMLSelectElement>) => setTypeState(e.target.value as keyof typeof Layouts))}>
					<option key="undefined" value="">Select layout...</option>
					{Object.keys(Layouts).map(key => (
						<option key={key} value={key}>{key}</option>
					))}
				</select>
			</div>
		</>
	)
}

Layout.types = types
Layout.breakpoint = BREAKPOINT
