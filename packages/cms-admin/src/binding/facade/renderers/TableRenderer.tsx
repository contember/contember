import * as React from 'react'
import { Table2, Table2Cell, Table2Row } from '@contember/ui'
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
							<Table2 heading={this.props.tableHeader}>
								{entities.map(value => (
									<AccessorContext.Provider value={value} key={value.getKey()}>
										<Table2Row>{this.props.children}</Table2Row>
									</AccessorContext.Provider>
								))}
							</Table2>
						)}
						{!!entities.length || <div>There are no items to display.</div>}
					</>
				)}
			</CollectionRenderer>
		)
	}
}
