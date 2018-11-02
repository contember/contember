import { UL } from '@blueprintjs/core'
import * as React from 'react'
import DataContext from '../../coreComponents/DataContext'
import EntityCollectionAccessor from '../../dao/EntityCollectionAccessor'
import { RendererProps } from './CommonRendererProps'
import DefaultRenderer from './DefaultRenderer'

export default class ListRenderer extends React.Component<RendererProps> {
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
