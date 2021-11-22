import { Component } from '@contember/binding'
import {
	LayoutPage,
	LayoutPageProps,
} from '@contember/ui'
import { FunctionComponent } from 'react'

export interface ImmutableContentLayoutRendererProps extends LayoutPageProps {}

export const ImmutableContentLayoutRenderer: FunctionComponent<ImmutableContentLayoutRendererProps> = Component(
	({ side, children, title, navigation, actions, headingProps }) => {
		return <LayoutPage
			actions={actions}
			headingProps={headingProps}
			navigation={navigation}
			side={side}
			title={title}
		>
			{children}
		</LayoutPage>
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
