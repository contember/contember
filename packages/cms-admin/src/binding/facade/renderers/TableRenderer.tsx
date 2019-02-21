import * as React from 'react'
import { Table } from '../../../components'
import { DataContext } from '../../coreComponents'
import { CollectionRenderer } from './CollectionRenderer'
import { RendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'

export class TableRenderer extends React.PureComponent<RendererProps> {
	public render() {
		return (
			<CollectionRenderer data={this.props.data}>
				{(rawData, entities) => (
					<>
						{DefaultRenderer.renderTitle(this.props.title)}
						{this.props.beforeContent}
						{!!entities.length && (
							<Table>
								{entities.map(value => (
									<DataContext.Provider value={value} key={value.getKey()}>
										{console.log(value)}
										<Table.Row>{this.props.children}</Table.Row>
									</DataContext.Provider>
								))}
							</Table>
						)}
						{!!entities.length || <div>There are no items to display.</div>}
					</>
				)}
			</CollectionRenderer>
		)
	}
}
