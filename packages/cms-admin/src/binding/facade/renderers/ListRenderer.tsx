import { UL } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { RendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'
import { LoadingSpinner } from './userFeedback'

export class ListRenderer extends React.PureComponent<RendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return <LoadingSpinner />
		}

		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

		return (
			<UL>
				{DefaultRenderer.renderTitle(this.props.title)}
				{normalizedData.map(
					value =>
						value && (
							<li key={value.getKey()}>
								<DataContext.Provider value={value}>{this.props.children}</DataContext.Provider>
							</li>
						)
				)}
			</UL>
		)
	}
}
