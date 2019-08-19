import { H1 } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext, Field } from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, EntityForRemovalAccessor, Environment } from '../../dao'
import { PersistButton } from '../buttons'
import { RendererProps } from './CommonRendererProps'
import { FeedbackRenderer } from './FeedbackRenderer'
import { LayoutInner, LayoutSide } from '../../../components'
import { SortableProps } from '../collections'

export class DefaultRenderer extends React.PureComponent<RendererProps> {
	public render() {
		return (
			<FeedbackRenderer data={this.props.data}>
				{data => {
					if (data.root instanceof EntityCollectionAccessor && !this.props.onlyOneInCollection) {
						const normalizedData = data.root.entities
						return (
							<>
								<LayoutInner>
									{normalizedData.map(
										value =>
											value && (
												<DataContext.Provider value={value} key={value.getKey()}>
													{DefaultRenderer.renderTitle(this.props.title)}
													{this.props.children}
												</DataContext.Provider>
											),
									)}
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
								<DataContext.Provider value={value}>
									<LayoutInner>
										{DefaultRenderer.renderTitle(this.props.title)}
										{this.props.children}
									</LayoutInner>
									<LayoutSide showBox={!!this.props.side}>
										<>
											{this.props.side}
											<PersistButton />
										</>
									</LayoutSide>
								</DataContext.Provider>
							)
						)
					}
				}}
			</FeedbackRenderer>
		)
	}

	public static renderTitle(title: RendererProps['title']): React.ReactNode {
		if (title) {
			return <H1>{title}</H1>
		}
		return null
	}

	public static generateSyntheticChildren(props: RendererProps, environment: Environment): React.ReactNode {
		console.log(':/')
		return (
			<>
				{props.side}
				{props.children}
			</>
		)
	}
}
