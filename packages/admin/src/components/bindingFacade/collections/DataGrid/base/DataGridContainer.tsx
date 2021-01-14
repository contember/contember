import { Component, Entity, EntityListBaseProps } from '@contember/binding'
import { Button, ButtonList, Table, TableCell, TableRow } from '@contember/ui'
import * as React from 'react'
import { EmptyMessage, EmptyMessageProps } from '../../helpers'
import { DataGridState } from '../grid/DataGridState'
import { GridPagingAction } from '../paging'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import { DataGridSetColumnFilter } from './DataGridSetFilter'
import { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'

export interface DataGridContainerPublicProps {
	emptyMessage?: React.ReactNode
	emptyMessageComponent?: React.ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}
}

export interface DataGridContainerOwnProps extends DataGridContainerPublicProps {
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
			filterArtifacts,
			orderDirections,
			columns,
		},

		emptyMessage = 'No data to display.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
	}) => {
		return (
			<div>
				<Table
					tableHead={
						<TableRow>
							{Array.from(columns, ([columnKey, column]) => {
								const filterArtifact = filterArtifacts.get(columnKey)
								const orderDirection = orderDirections.get(columnKey)
								return (
									<DataGridHeaderCell
										key={columnKey}
										environment={accessor.environment}
										filterArtifact={filterArtifact}
										orderDirection={orderDirection}
										setFilter={newFilter => setFilter(columnKey, newFilter)}
										setOrderBy={newOrderBy => setOrderBy(columnKey, newOrderBy)}
										ascOrderIcon={column.ascOrderIcon}
										descOrderIcon={column.descOrderIcon}
										filterRenderer={column.enableFiltering !== false ? column.filterRenderer : undefined}
									>
										{column.header}
									</DataGridHeaderCell>
								)
							})}
						</TableRow>
					}
				>
					{!!accessor.length &&
						Array.from(accessor, entity => (
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
					{!accessor.length && (
						<TableRow>
							<TableCell colSpan={columns.size}>
								<EmptyMessageComponent {...emptyMessageComponentExtraProps}>{emptyMessage}</EmptyMessageComponent>
							</TableCell>
						</TableRow>
					)}
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
