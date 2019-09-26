import * as React from 'react'
import { Table, TableRow } from '@contember/ui'
import { AccessorContext, DataRendererProps } from '../../coreComponents'
import { CollectionRenderer } from './CollectionRenderer'
import { CommonRendererProps } from './CommonRendererProps'
import { DefaultRenderer } from './DefaultRenderer'

export interface TableRendererProps extends CommonRendererProps {
	tableHeader?: React.ReactNode
}

export class TableRenderer extends React.PureComponent<DataRendererProps & TableRendererProps> {
	public render() {
		return (
			<CollectionRenderer data={this.props.data}>
				{(rawData, entities) => (
					<>
						{DefaultRenderer.renderTitleBar(this.props)}
						{this.props.beforeContent}
						{(entities.length > 0 || this.props.tableHeader) && (
							<Table heading={this.props.tableHeader}>
								{entities.map(value => (
									<AccessorContext.Provider value={value} key={value.getKey()}>
										<TableRow>{this.props.children}</TableRow>
									</AccessorContext.Provider>
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
