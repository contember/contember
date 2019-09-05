import { UL } from '@blueprintjs/core'
import * as React from 'react'
import { AccessorContext } from '../../coreComponents'
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
									<AccessorContext.Provider value={value}>{this.props.children}</AccessorContext.Provider>
								</li>
							))}
						</UL>
					</LayoutInner>
				)}
			</CollectionRenderer>
		)
	}
}
