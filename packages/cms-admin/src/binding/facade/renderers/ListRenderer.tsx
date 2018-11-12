import { UL } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { RendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'

export class ListRenderer extends React.PureComponent<RendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

		return (
			<UL>
				{DefaultRenderer.renderTitle(this.props.title)}
				{normalizedData.map((value, i) => (
					<li key={i}>
						<DataContext.Provider value={value}>{this.props.children}</DataContext.Provider>
					</li>
				))}
			</UL>
		)
	}
}
