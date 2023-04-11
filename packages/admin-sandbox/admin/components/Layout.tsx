import { Stack, StackOwnProps } from '@contember/admin'
import { CommonSlots, LayoutSlotsProvider, PropsWithRequiredChildren } from '@contember/cms-layout'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { ChangeEvent, ComponentType, ReactNode, createElement, memo, useEffect, useRef, useState } from 'react'
import * as Layouts from './Layouts'
import { MetaDirective, MetaDirectivesConsumer } from './MetaDirectives'

export const { Actions, Back, Title: TitleSlot, Content, Logo, Navigation, Sidebar, ...restOfCommonSlots } = CommonSlots

if (import.meta.env.DEV) {
	const exhaustiveCheck: Record<string, never> = restOfCommonSlots
}

export const Title = memo<{ children: string | null | undefined }>(({ children }) => (
	<MetaDirective name="title" content={children} />
))

function SlotWithStack<C extends ComponentType<PropsWithRequiredChildren>>(Component: C) {
	const WrappedComponent = memo<Partial<StackOwnProps>>(({
		direction = 'vertical',
		gap = 'large',
		...rest
	}) => {
		return createElement(
			Component,
			{
				children: <Stack direction={direction} gap={gap} {...rest} />,
			},
		)
	})
	WrappedComponent.displayName = Component.displayName

	return WrappedComponent
}

export const SidebarStack = SlotWithStack(Sidebar)
export const ContentStack = SlotWithStack(Content)

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
		<LayoutSlotsProvider>
			<MetaDirectivesConsumer>{({ layout, title }) => {
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
			}}</MetaDirectivesConsumer>
			{props.children}
			<div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 1000 }}>
				<select value={typeState} onChange={useReferentiallyStableCallback((e: ChangeEvent<HTMLSelectElement>) => setTypeState(e.target.value as keyof typeof Layouts))}>
					<option key="undefined" value="">Select layout...</option>
					{Object.keys(Layouts).map(key => (
						<option key={key} value={key}>{key}</option>
					))}
				</select>
			</div>
		</LayoutSlotsProvider>
	)
}

Layout.types = types
Layout.breakpoint = BREAKPOINT
