import { H1 } from '@blueprintjs/core'
import * as React from 'react'
import { LayoutInner, LayoutSide } from '../../../components'
import { DataContext } from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, EntityForRemovalAccessor, Environment } from '../../dao'
import { PersistButton } from '../buttons'
import { RendererProps } from './CommonRendererProps'
import { FeedbackRenderer } from './FeedbackRenderer'

export class DefaultRenderer extends React.PureComponent<RendererProps> {
	public render() {
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
												<DataContext.Provider value={value} key={value.getKey()}>
													{DefaultRenderer.renderTitle(this.props.title)}
													{this.props.children}
												</DataContext.Provider>
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
								<DataContext.Provider value={value}>
									<LayoutInner>
										{DefaultRenderer.renderTitle(this.props.title)}
										{this.props.children}
										<PersistButton />
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
		return (
			<>
				{props.side}
				{props.children}
			</>
		)
	}
}
