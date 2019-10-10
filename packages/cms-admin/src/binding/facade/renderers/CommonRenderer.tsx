import { ContainerSpinner, IncreaseHeadingDepth, TitleBar, TitleBarProps } from '@contember/ui'
import * as React from 'react'
import { useRedirect } from '../../../components'
import { AccessorTreeStateContext, AccessorTreeStateName, AccessorTreeStateWithDataContext } from '../../accessorTree'
import { Component } from '../../coreComponents'

export interface TitleBarRendererProps extends Omit<TitleBarProps, 'children'> {
	title?: React.ReactNode
}

export interface CommonRendererProps extends TitleBarRendererProps {
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
	children?: React.ReactNode
}

export const CommonRenderer = Component<CommonRendererProps>(
	({ navigation, actions, headingProps, title, children, beforeContent, afterContent }) => {
		const accessorTreeState = React.useContext(AccessorTreeStateContext)

		const redirect = useRedirect()
		const titleBar = React.useMemo(
			() => (
				<TitleBar navigation={navigation} actions={actions} headingProps={headingProps}>
					{title}
				</TitleBar>
			),
			[actions, headingProps, navigation, title],
		)
		const content = React.useMemo(() => <IncreaseHeadingDepth currentDepth={1}>{children}</IncreaseHeadingDepth>, [
			children,
		])

		if (
			accessorTreeState.name === AccessorTreeStateName.Uninitialized ||
			accessorTreeState.name === AccessorTreeStateName.Querying
		) {
			return <ContainerSpinner />
		}
		if (accessorTreeState.name === AccessorTreeStateName.RequestError) {
			return <>'Faill'</>
		}

		return (
			<>
				{titleBar}
				{beforeContent}
				<AccessorTreeStateWithDataContext.Provider value={accessorTreeState}>
					{content}
				</AccessorTreeStateWithDataContext.Provider>
				{afterContent}
			</>
		)
	},
	(props: CommonRendererProps): React.ReactNode => (
		<>
			{props.title}
			{props.beforeContent}
			{props.afterContent}
			{props.children}
		</>
	),
	'CommonRenderer',
)
