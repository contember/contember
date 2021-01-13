import { Component, Entity, EntityListBaseProps } from '@contember/binding'
import { Button, ButtonList, Table, TableCell, TableRow } from '@contember/ui'
import * as React from 'react'
import { DataGridState } from '../grid/DataGridState'
import { GridPagingAction } from '../paging'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import { getOrderDirection } from './DataGridOrderDirection'
import { DataGridSetColumnFilter } from './DataGridSetFilter'
import { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'

export interface DataGridContainerOwnProps {
	dataGridState: DataGridState
	setFilter: DataGridSetColumnFilter
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export interface DataGridContainerProps extends DataGridContainerOwnProps, EntityListBaseProps {}

export const DataGridContainer = Component<DataGridContainerProps>(
	({
		children,
		accessor,
		setFilter,
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
				<Table>
					<thead>
						<TableRow>
							{Array.from(columns, ([columnKey, column]) => {
								const filter = filters.get(columnKey)
								const orderBy = orderBys.get(columnKey)
								return (
									<DataGridHeaderCell
										key={columnKey}
										filter={filter}
										orderBy={orderBy}
										orderDirection={getOrderDirection(orderBy)}
										setFilter={newFilter => setFilter(columnKey, newFilter)}
										setOrderBy={newOrderBy => setOrderBy(columnKey, newOrderBy)}
										ascOrderIcon={column.ascOrderIcon}
										descOrderIcon={column.descOrderIcon}
									>
										{column.header}
									</DataGridHeaderCell>
								)
							})}
						</TableRow>
					</thead>
					<tbody>
						{Array.from(accessor, entity => (
							<Entity
								key={entity.key}
								accessor={entity}
								//entityComponent={}
								//entityProps={}
							>
								<TableRow>
									{Array.from(columns, ([columnKey, column]) => (
										<TableCell key={columnKey}>{column.children}</TableCell>
									))}
								</TableRow>
							</Entity>
						))}
					</tbody>
				</Table>
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
