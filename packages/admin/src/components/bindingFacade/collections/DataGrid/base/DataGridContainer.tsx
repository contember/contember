import { Component, Entity, EntityListBaseProps } from '@contember/binding'
import { Button, ButtonList } from '@contember/ui'
import * as React from 'react'
import { DataGridState } from '../grid/DataGridState'
import { GridPagingAction } from '../paging'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import { getOrderDirection } from './DataGridOrderDirection'
import { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'

export interface DataGridContainerOwnProps {
	dataGridState: DataGridState
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export interface DataGridContainerProps extends DataGridContainerOwnProps, EntityListBaseProps {}

export const DataGridContainer = Component<DataGridContainerProps>(
	({
		children,
		accessor,
		setOrderBy,
		updatePaging,
		dataGridState: {
			paging: { pageIndex, itemsPerPage },
			filters,
			orderBys,
			columns,
		},
	}) => {
		return (
			<div>
				<table>
					<thead>
						<tr>
							{Array.from(columns, ([columnKey, column]) => {
								const orderBy = orderBys.get(columnKey)
								return (
									<DataGridHeaderCell
										key={columnKey}
										orderBy={orderBy}
										orderDirection={getOrderDirection(orderBy)}
										setOrderBy={newOrderBy => setOrderBy(columnKey, newOrderBy)}
										ascOrderIcon={column.ascOrderIcon}
										descOrderIcon={column.descOrderIcon}
									>
										{column.header}
									</DataGridHeaderCell>
								)
							})}
						</tr>
					</thead>
					<tbody>
						{Array.from(accessor, entity => (
							<Entity
								key={entity.key}
								accessor={entity}
								//entityComponent={}
								//entityProps={}
							>
								<tr>
									{Array.from(columns, ([columnKey, column]) => (
										<td key={columnKey}>{column.children}</td>
									))}
								</tr>
							</Entity>
						))}
					</tbody>
				</table>
				<ButtonList>
					{pageIndex > 1 && <Button onClick={() => updatePaging({ type: 'goToFirstPage' })}>First</Button>}
					{pageIndex > 0 && <Button onClick={() => updatePaging({ type: 'goToPreviousPage' })}>Previous</Button>}
					<span>Page {pageIndex + 1}</span>
					{itemsPerPage !== null && accessor.length === itemsPerPage && (
						<Button onClick={() => updatePaging({ type: 'goToNextPage' })}>Next</Button>
					)}
				</ButtonList>
			</div>
		)
	},
	props => <>{props.children}</>,
	'DataGridContainer',
)
