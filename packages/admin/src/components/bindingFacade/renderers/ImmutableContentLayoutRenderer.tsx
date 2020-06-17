import { Component } from '@contember/binding'
import { IncreaseHeadingDepth, TitleBar, TitleBarProps } from '@contember/ui'
import * as React from 'react'
import { LayoutInner, LayoutSide } from '../../LayoutInner'

export interface ImmutableContentLayoutRendererProps extends Omit<TitleBarProps, 'children'> {
	side?: React.ReactNode
	title?: React.ReactNode
	children?: React.ReactNode
}

export const ImmutableContentLayoutRenderer = Component<ImmutableContentLayoutRendererProps>(
	({ side, children, title, navigation, actions, headingProps }) => {
		const content = React.useMemo(() => <IncreaseHeadingDepth currentDepth={1}>{children}</IncreaseHeadingDepth>, [
			children,
		])

		return (
			<>
				<LayoutInner>
					{!!title && (
						<TitleBar navigation={navigation} actions={actions} headingProps={headingProps}>
							{title}
						</TitleBar>
					)}
					{content}
				</LayoutInner>
				{side && <LayoutSide>{side}</LayoutSide>}
			</>
		)
	},
	props => (
		<>
			{props.title}
			{props.children}
			{props.side}
		</>
	),
	'ImmutableContentLayoutRenderer',
)
