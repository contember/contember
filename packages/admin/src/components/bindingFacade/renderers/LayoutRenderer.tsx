import { Component } from '@contember/react-binding'
import { LayoutPage, LayoutPageProps } from '@contember/ui'
import { FunctionComponent } from 'react'

export interface LayoutRendererProps extends LayoutPageProps {
}

export const LayoutRenderer: FunctionComponent<LayoutRendererProps> = Component(
	LayoutPage,
	props => (
		<>
			{props.title}
			{props.afterTitle}
			{props.children}
			{props.side}
			{props.actions}
			{props.navigation}
		</>
	),
	'LayoutRenderer',
)
