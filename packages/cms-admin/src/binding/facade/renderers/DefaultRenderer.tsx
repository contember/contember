import { H1 } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext, Field } from '../../coreComponents'
import { EntityCollectionAccessor, Environment } from '../../dao'
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
					if (data.root instanceof EntityCollectionAccessor) {
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
						const value = data.root
						return (
							<>
								<LayoutInner>
									<DataContext.Provider value={value}>
										{DefaultRenderer.renderTitle(this.props.title)}
										{this.props.children}
									</DataContext.Provider>
								</LayoutInner>
								<LayoutSide>
									<PersistButton />
								</LayoutSide>
							</>
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
