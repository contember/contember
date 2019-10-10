import { ContainerSpinner, IncreaseHeadingDepth, TitleBar } from '@contember/ui'
import * as React from 'react'
import { LayoutInner, LayoutSide } from '../../../components'
import { AccessorTreeStateContext, AccessorTreeStateName } from '../../accessorTree'
import { AccessorContext } from '../../coreComponents'
import { Component } from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, EntityForRemovalAccessor, Environment } from '../../dao'
import { PersistButton } from '../buttons'
import { CommonRendererProps } from './CommonRenderer'

export interface DefaultRendererProps extends CommonRendererProps {
	persistButtonComponent: React.ComponentType
	side?: React.ReactNode
}

export const DefaultRenderer = Component<DefaultRendererProps>(
	props => {
		return null
		/*const accessorTreeState = React.useContext(AccessorTreeStateContext)

		if (accessorTreeState.name === AccessorTreeStateName.Uninitialized || accessorTreeState.name === AccessorTreeStateName.Querying) {
			return <ContainerSpinner />
		}
		if (accessorTreeState.name === AccessorTreeStateName.RequestError) {
			return 'Faill'
		}

		const content = (
			<>
				<TitleBar navigation={navigation} actions={actions} headingProps={headingProps}>
					{title}
				</TitleBar>
				<IncreaseHeadingDepth currentDepth={1}>{this.props.children}</IncreaseHeadingDepth>
			</>
		)

		return (
			<FeedbackRenderer data={this.props.data}>
				{data => {
					if (data.root instanceof EntityCollectionAccessor && !this.props.onlyOneInCollection) {
						return (
							<>
								<LayoutInner>
									{data.root.entities.map(
										value =>
											value && (
												<AccessorContext.Provider value={value} key={value.getKey()}>
													{content}
												</AccessorContext.Provider>
											),
									)}
									<PersistButton />
								</LayoutInner>
								<LayoutSide>
									<PersistButton />
								</LayoutSide>
							</>
						)
					} else {
						const value: EntityAccessor | EntityForRemovalAccessor | undefined =
							this.props.onlyOneInCollection && data.root instanceof EntityCollectionAccessor
								? data.root.entities[0]
								: (data.root as EntityAccessor | EntityForRemovalAccessor | undefined)
						return (
							value && (
								<AccessorContext.Provider value={value}>
									<LayoutInner>
										{content}
										<div style={{ margin: '1em 0' }}>
											<PersistButton />
										</div>
									</LayoutInner>
									<LayoutSide showBox={!!this.props.side}>
										<>
											{this.props.side}
											<PersistButton />
										</>
									</LayoutSide>
								</AccessorContext.Provider>
							)
						)
					}
				}}
			</FeedbackRenderer>
		)*/
	},
	(props: DefaultRendererProps, environment: Environment): React.ReactNode => (
		<>
			{props.side}
			{props.children}
		</>
	),
	'DefaultRenderer',
)
