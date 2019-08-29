import { UL } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext } from '../../coreComponents'
import { CollectionRenderer } from './CollectionRenderer'
import { RendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'
import { LayoutInner } from '../../../components'

export class ListRenderer extends React.PureComponent<RendererProps> {
	public render() {
		return (
			<CollectionRenderer data={this.props.data}>
				{(rawData, entities) => (
					<LayoutInner>
						{DefaultRenderer.renderTitleBar(this.props)}
						{this.props.beforeContent}
						<UL>
							{entities.map(value => (
								<li key={value.getKey()}>
									<DataContext.Provider value={value}>{this.props.children}</DataContext.Provider>
								</li>
							))}
						</UL>
					</LayoutInner>
				)}
			</CollectionRenderer>
		)
	}
}
