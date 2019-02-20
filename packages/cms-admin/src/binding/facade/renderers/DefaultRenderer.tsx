import { H1 } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { PersistButton } from '../buttons'
import { RendererProps } from './CommonRendererProps'
import { LoadingRenderer } from './LoadingRenderer'

export class DefaultRenderer extends React.PureComponent<RendererProps> {
	public render() {
		return (
			<LoadingRenderer data={this.props.data}>
				{data => {
					const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

					return (
						<>
							{normalizedData.map(
								value =>
									value && (
										<DataContext.Provider value={value} key={value.getKey()}>
											{DefaultRenderer.renderTitle(this.props.title)}
											{this.props.children}
										</DataContext.Provider>
									)
							)}
							<PersistButton />
						</>
					)
				}}
			</LoadingRenderer>
		)
	}

	public static renderTitle(title: RendererProps['title']): React.ReactNode {
		if (title) {
			return <H1>{title}</H1>
		}
		return null
	}
}
