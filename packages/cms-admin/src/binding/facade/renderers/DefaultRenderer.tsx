import { H1 } from '@blueprintjs/core'
import { TitleBar } from '@contember/ui'
import * as React from 'react'
import { LayoutInner, LayoutSide } from '../../../components'
import { DataContext } from '../../coreComponents'
import { EntityAccessor, EntityCollectionAccessor, EntityForRemovalAccessor, Environment } from '../../dao'
import { PersistButton } from '../buttons'
import { RendererProps, TitleBarRendererProps } from './CommonRendererProps'
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
													{DefaultRenderer.renderTitleBar(this.props)}
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
										{DefaultRenderer.renderTitleBar(this.props)}
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

	public static renderTitleBar({ title, navigation, actions, headingProps }: TitleBarRendererProps): React.ReactNode {
		if (title) {
			return (
				<TitleBar navigation={navigation} actions={actions} headingProps={headingProps}>
					{title}
				</TitleBar>
			)
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
