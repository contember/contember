import { Component } from '@contember/binding'
import { IncreaseHeadingDepth, TitleBar, TitleBarProps } from '@contember/ui'
import { Fragment, FunctionComponent, ReactNode, useMemo } from 'react'
import { LayoutContent, LayoutInner, LayoutSide } from '../../LayoutInner'

export interface ImmutableContentLayoutRendererProps extends Omit<TitleBarProps, 'children'> {
	side?: ReactNode
	title?: ReactNode
	children?: ReactNode
}

export const ImmutableContentLayoutRenderer: FunctionComponent<ImmutableContentLayoutRendererProps> = Component(
	({ side, children, title, navigation, actions, headingProps }) => {
		const content = useMemo(() => <IncreaseHeadingDepth currentDepth={1}>{children}</IncreaseHeadingDepth>, [children])
		const Wrap = side ? LayoutContent : Fragment

		return (
			<Wrap>
				<LayoutInner>
					{!!title && (
						<TitleBar navigation={navigation} actions={actions} headingProps={headingProps}>
							{title}
						</TitleBar>
					)}
					{content}
				</LayoutInner>
				{side && <LayoutSide>{side}</LayoutSide>}
			</Wrap>
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
