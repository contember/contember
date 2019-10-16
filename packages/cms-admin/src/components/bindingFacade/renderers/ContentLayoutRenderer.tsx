import { IncreaseHeadingDepth, TitleBar, TitleBarProps } from '@contember/ui'
import * as React from 'react'
import {
	AccessorContext,
	AccessorTreeStateWithDataContext,
	Component,
	EntityCollectionAccessor,
} from '../../../binding'
import { LayoutInner, LayoutSide } from '../../LayoutInner'
import { PersistButton } from '../buttons'
import { FeedbackRenderer, FeedbackRendererProps } from './FeedbackRenderer'

export interface ContentLayoutRendererProps extends ContentLayoutRendererInnerProps {}

export const ContentLayoutRenderer = Component<ContentLayoutRendererProps>(
	props => (
		<FeedbackRenderer>
			<ContentLayoutRendererInner {...props} />
		</FeedbackRenderer>
	),
	'ContentLayoutRenderer',
)

interface ContentLayoutRendererInnerProps extends FeedbackRendererProps, Omit<TitleBarProps, 'children'> {
	persistButtonComponent?: React.ComponentType
	side?: React.ReactNode
	title?: React.ReactNode
	beforeContent?: React.ReactNode
	afterContent?: React.ReactNode
}

const ContentLayoutRendererInner = Component<ContentLayoutRendererInnerProps>(
	({
		side,
		persistButtonComponent: PersistButtonComponent = PersistButton,
		children,
		title,
		beforeContent,
		afterContent,

		navigation,
		actions,
		headingProps,
	}) => {
		const accessorTreeState = React.useContext(AccessorTreeStateWithDataContext)
		const titleBar = React.useMemo(
			() =>
				title && (
					<TitleBar navigation={navigation} actions={actions} headingProps={headingProps}>
						{title}
					</TitleBar>
				),
			[actions, headingProps, navigation, title],
		)
		const content = React.useMemo(() => <IncreaseHeadingDepth currentDepth={1}>{children}</IncreaseHeadingDepth>, [
			children,
		])

		if (accessorTreeState === undefined) {
			return null
		}

		const data = accessorTreeState.data
		const root = data.root

		return (
			<>
				<LayoutInner>
					{root instanceof EntityCollectionAccessor ? (
						<>
							{titleBar}
							{beforeContent}
							{data.map(
								accessor =>
									accessor && (
										<AccessorContext.Provider value={accessor} key={accessor.getKey()}>
											{content}
										</AccessorContext.Provider>
									),
							)}
							{afterContent}
						</>
					) : (
						<AccessorContext.Provider value={root}>
							{titleBar}
							{beforeContent}
							{content}
							{afterContent}
						</AccessorContext.Provider>
					)}
				</LayoutInner>
				<LayoutSide>
					{side &&
						data.map(
							accessor =>
								accessor && (
									<AccessorContext.Provider value={accessor} key={accessor.getKey()}>
										{side}
									</AccessorContext.Provider>
								),
						)}
					<PersistButtonComponent />
				</LayoutSide>
			</>
		)
	},
	props => (
		<>
			{props.title}
			{props.beforeContent}
			{props.children}
			{props.afterContent}
			{props.side}
			{props.persistButtonComponent}
		</>
	),
	'ContentLayoutRendererInner',
)
