import * as React from 'react'
import { DataContext } from '../../coreComponents'
import { EntityCollectionAccessor } from '../../dao'
import { RendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'
import { LoadingSpinner } from './userFeedback'
import { Table } from '../../../components'

export class TableRenderer extends React.PureComponent<RendererProps> {
	public render() {
		const data = this.props.data

		if (!data) {
			return <LoadingSpinner />
		}

		const normalizedData = data.root instanceof EntityCollectionAccessor ? data.root.entities : [data.root]

		return (
			<>
				{DefaultRenderer.renderTitle(this.props.title)}
				{this.props.beforeContent}
				<Table>
					{normalizedData.map(
						value =>
							value && (
								<DataContext.Provider value={value} key={value.getKey()}>
									<Table.Row>{this.props.children}</Table.Row>
								</DataContext.Provider>
							)
					)}
				</Table>
			</>
		)
	}
}
