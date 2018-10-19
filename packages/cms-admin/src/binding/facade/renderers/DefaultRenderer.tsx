import * as React from 'react'
import DataContext from '../../coreComponents/DataContext'
import { DataRendererProps } from '../../coreComponents/DataProvider'
import EntityCollectionAccessor from '../../dao/EntityCollectionAccessor'
import { PersistButton } from '../buttons'

export default class DefaultRenderer extends React.Component<DataRendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return null // TODO display a message
		}

		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

		return (
			<>
				{normalizedData.map((value, i) => (
					<DataContext.Provider value={value} key={i}>
						{this.props.children}
					</DataContext.Provider>
				))}
				<PersistButton />
			</>
		)
	}
}
