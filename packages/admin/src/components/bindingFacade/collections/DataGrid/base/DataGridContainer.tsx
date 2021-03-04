import { Component, Entity, EntityListBaseProps, EntityName, Filter } from '@contember/binding'
import { Button, ButtonList, Justification, Table, TableCell, TableRow } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { EmptyMessage, EmptyMessageProps } from '../../helpers'
import { GridPagingAction } from '../paging'
import { DataGridColumnHiding } from './DataGridColumnHiding'
import { DataGridFullFilters } from './DataGridFullFilters'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import { DataGridSetColumnFilter } from './DataGridSetFilter'
import { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'
import { DataGridState } from './DataGridState'
import { getColumnFilter } from './getColumnFilter'
import { useHackyTotalCount } from './useHackyTotalCount'

export interface DataGridCellPublicProps {
	justification?: Justification
	shrunk?: boolean
	hidden?: boolean
	canBeHidden?: boolean
}

export interface DataGridContainerPublicProps {
	allowColumnVisibilityControls?: boolean
	allowAggregateFilterControls?: boolean

	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}
}

export interface DataGridContainerOwnProps extends DataGridContainerPublicProps {
	desiredState: DataGridState
	displayedState: DataGridState
	entityName: EntityName
	filter: Filter | undefined
	setIsColumnHidden: DataGridSetIsColumnHidden
	setFilter: DataGridSetColumnFilter
	setOrderBy: DataGridSetColumnOrderBy
	updatePaging: (action: GridPagingAction) => void
}

export interface DataGridContainerProps extends DataGridContainerOwnProps, EntityListBaseProps {}

export const DataGridContainer: FunctionComponent<DataGridContainerProps> = Component(
	({
		children,
		accessor,
		setFilter,
		setIsColumnHidden,
		setOrderBy,
		updatePaging,
		desiredState,
		displayedState,
		entityName,
		filter,

		allowAggregateFilterControls,
		allowColumnVisibilityControls,
		emptyMessage = 'No data to display.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
	}) => {
		const {
			paging: { pageIndex, itemsPerPage },
			filterArtifacts,
			orderDirections,
			columns,
		} = desiredState
		const totalCount = useHackyTotalCount(entityName, filter)
		const normalizedItemCount = itemsPerPage === null ? accessor.length : totalCount
		const pagesCount =
			totalCount !== undefined && itemsPerPage !== null ? Math.ceil(totalCount / itemsPerPage) : undefined

		const pagingSummary = (
			<>
				Page {pageIndex + 1}
				{pagesCount !== undefined && ` / ${pagesCount.toFixed(0)}`}
				{normalizedItemCount !== undefined && ` (${normalizedItemCount} items)`}
			</>
		)

		return (
			<div>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1em', flexWrap: 'wrap' }}>
					<div>{pagingSummary}</div>
					<ButtonList>
						{allowColumnVisibilityControls !== false && (
							<DataGridColumnHiding desiredState={desiredState} setIsColumnHidden={setIsColumnHidden} />
						)}
						{allowAggregateFilterControls !== false && (
							<DataGridFullFilters
								desiredState={desiredState}
								environment={accessor.environment}
								setFilter={setFilter}
							/>
						)}
					</ButtonList>
				</div>
				<Table
					tableHead={
						<TableRow>
							{Array.from(columns)
								// We use desired state here to give immediate feedback about column changes.
								.filter(([columnKey]) => !desiredState.hiddenColumns.has(columnKey))
								.map(([columnKey, column]) => {
									const filterArtifact = filterArtifacts.get(columnKey)
									const orderDirection = orderDirections.get(columnKey)
									return (
										<DataGridHeaderCell
											key={columnKey}
											environment={accessor.environment}
											filterArtifact={filterArtifact}
											emptyFilterArtifact={column.enableFiltering !== false ? column.emptyFilter : undefined}
											orderDirection={orderDirection}
											setFilter={newFilter => setFilter(columnKey, newFilter)}
											setOrderBy={newOrderBy => setOrderBy(columnKey, newOrderBy)}
											headerJustification={column.headerJustification || column.justification}
											shrunk={column.shrunk}
											hasFilter={getColumnFilter(column, filterArtifact, accessor.environment) !== undefined}
											header={column.header}
											ascOrderIcon={column.ascOrderIcon}
											descOrderIcon={column.descOrderIcon}
											filterRenderer={column.enableFiltering !== false ? column.filterRenderer : undefined}
										/>
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
									{Array.from(columns)
										.filter(([columnKey]) => !desiredState.hiddenColumns.has(columnKey))
										.map(([columnKey, column]) => {
											// This is tricky. We need to render a table cell from here no matter what so that the cell count
											// matches that of the headers. However, there might be a header displayed for a column whose data
											// has not yet been fetched. Displaying its cell contents from here would cause an error. Also, the
											// column may have just been hidden but the information hasn't made it to displayed sate yet.
											// For these, we just display an empty cell then.
											if (displayedState.hiddenColumns.has(columnKey)) {
												return <TableCell key={columnKey} shrunk />
											}
											return (
												<TableCell key={columnKey} shrunk={column.shrunk} justification={column.justification}>
													{column.children}
												</TableCell>
											)
										})}
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
				{!!accessor.length && (
					<div style={{ margin: '1em 0', display: 'flex', justifyContent: 'space-between' }}>
						<div>{pagingSummary}</div>
						<div style={{ display: 'flex', gap: '.5em' }}>
							<Button
								distinction="seamless"
								disabled={pageIndex === 0}
								onClick={() => updatePaging({ type: 'goToFirstPage' })}
							>
								First
							</Button>
							<Button disabled={pageIndex === 0} onClick={() => updatePaging({ type: 'goToPreviousPage' })}>
								Previous
							</Button>
							{itemsPerPage !== null && (
								<>
									<Button
										disabled={accessor.length !== itemsPerPage}
										onClick={() => updatePaging({ type: 'goToNextPage' })}
									>
										Next
									</Button>
									<Button
										distinction="seamless"
										disabled={pagesCount === undefined || pageIndex === pagesCount - 1}
										onClick={() =>
											pagesCount !== undefined && updatePaging({ type: 'goToPage', newPageIndex: pagesCount - 1 })
										}
									>
										Last
									</Button>
								</>
							)}
						</div>
					</div>
				)}
			</div>
		)
	},
	props => <>{props.children}</>,
	'DataGridContainer',
)
