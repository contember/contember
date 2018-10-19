import { UL } from '@blueprintjs/core'
import * as React from 'react'
import DataContext from '../../coreComponents/DataContext'
import { DataRendererProps } from '../../coreComponents/DataProvider'
import EntityCollectionAccessor from '../../dao/EntityCollectionAccessor'

export default class ListRenderer extends React.Component<DataRendererProps> {

	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

		return (
			<UL>
				{normalizedData.map((value, i) => (
					<li key={i}>
						<DataContext.Provider value={value}>
							{this.props.children}
						</DataContext.Provider>
					</li>
				))}
			</UL>
		)
	}
}
