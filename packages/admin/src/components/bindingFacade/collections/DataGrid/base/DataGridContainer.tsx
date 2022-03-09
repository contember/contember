import { Component, Entity, EntityListBaseProps, EntityName, Filter } from '@contember/binding'
import { Button, ButtonList, Stack, Table, TableCell, TableRow } from '@contember/ui'
import type { ComponentType, FunctionComponent, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { EmptyMessage, EmptyMessageProps } from '../../helpers'
import type { GridPagingAction } from '../paging'
import { DataGridColumnHiding } from './DataGridColumnHiding'
import { dataGridDictionary } from './dataGridDictionary'
import { DataGridFullFilters } from './DataGridFullFilters'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import type { DataGridSetColumnFilter } from './DataGridSetFilter'
import type { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import type { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'
import type { DataGridState } from './DataGridState'
import { getColumnFilter } from './getColumnFilter'
import { useHackyTotalCount } from './useHackyTotalCount'

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
	filter: Filter
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
		emptyMessage,
		emptyMessageComponent,
	}) => {
		const {
			paging: { pageIndex, itemsPerPage },
			filterArtifacts,
			orderDirections,
			columns,
		} = desiredState
		const formatMessage = useMessageFormatter(dataGridDictionary)
		const totalCount = useHackyTotalCount(entityName, filter)
		const normalizedItemCount = itemsPerPage === null ? accessor.length : totalCount
		const pagesCount =
			totalCount !== undefined && itemsPerPage !== null ? Math.ceil(totalCount / itemsPerPage) : undefined

		const pagingSummary = (
			<>
				{pagesCount === undefined
					? formatMessage('dataGrid.paging.status.unknownPageTotal', { pageNumber: pageIndex + 1 })
					: formatMessage('dataGrid.paging.status.knownPageTotal', {
							pageNumber: pageIndex + 1,
							totalPageCount: pagesCount,
					  })}
				{normalizedItemCount !== undefined &&
					` ${formatMessage('dataGrid.paging.status.itemCount', { itemCount: normalizedItemCount })}`}
			</>
		)

		return (
			<Stack direction="vertical">
				<Stack direction="horizontal" justify="space-between" style={{ flexWrap: 'wrap' }}>
					<div>{pagingSummary}</div>
					<ButtonList>
						{allowColumnVisibilityControls !== false && (
							<DataGridColumnHiding
								desiredState={desiredState}
								formatMessage={formatMessage}
								setIsColumnHidden={setIsColumnHidden}
							/>
						)}
						{allowAggregateFilterControls !== false && (
							<DataGridFullFilters
								desiredState={desiredState}
								environment={accessor.environment}
								formatMessage={formatMessage}
								setFilter={setFilter}
							/>
						)}
					</ButtonList>
				</Stack>
				<Table
					tableHead={
						<TableRow>
							{Array.from(columns)
								// We use desired state here to give immediate feedback about column changes.
								.filter(([columnKey]) => !desiredState.hiddenColumns[columnKey])
								.map(([columnKey, column]) => {
									const filterArtifact = filterArtifacts[columnKey]
									const orderDirection = orderDirections[columnKey]
									const orderColumns = Object.keys(orderDirections)
									return (
										<DataGridHeaderCell
											key={columnKey}
											environment={accessor.environment}
											filterArtifact={filterArtifact}
											emptyFilterArtifact={column.enableFiltering !== false ? column.emptyFilter : null}
											orderState={orderDirection ? {
												direction: orderDirection,
												index: orderColumns.length > 1 ? orderColumns.indexOf(columnKey) : undefined,
											} : undefined}
											setFilter={newFilter => setFilter(columnKey, newFilter)}
											setOrderBy={(newOrderBy, append = false) => setOrderBy(columnKey, newOrderBy, append)}
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
							>
								<TableRow>
									{Array.from(columns)
										.filter(([columnKey]) => !desiredState.hiddenColumns[columnKey])
										.map(([columnKey, column]) => {
											// This is tricky. We need to render a table cell from here no matter what so that the cell count
											// matches that of the headers. However, there might be a header displayed for a column whose data
											// has not yet been fetched. Displaying its cell contents from here would cause an error. Also, the
											// column may have just been hidden but the information hasn't made it to displayed sate yet.
											// For these, we just display an empty cell then.
											if (displayedState.hiddenColumns[columnKey]) {
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
								<EmptyMessage
									distinction="seamless"
									component={emptyMessageComponent}
								>
									{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
								</EmptyMessage>
							</TableCell>
						</TableRow>
					)}
				</Table>
				{!!normalizedItemCount && (
					<Stack direction="horizontal" justify="space-between" style={{ flexWrap: 'wrap' }}>
						<div>{pagingSummary}</div>
						<Stack direction="horizontal" justify="space-between" gap="small">
							<Button
								distinction="seamless"
								disabled={pageIndex === 0}
								onClick={() => updatePaging({ type: 'goToFirstPage' })}
							>
								{formatMessage('dataGrid.paging.first')}
							</Button>
							<Button disabled={pageIndex === 0} onClick={() => updatePaging({ type: 'goToPreviousPage' })}>
								{formatMessage('dataGrid.paging.previous')}
							</Button>
							{itemsPerPage !== null && (
								<>
									<Button
										disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
										onClick={() => updatePaging({ type: 'goToNextPage' })}
									>
										{formatMessage('dataGrid.paging.next')}
									</Button>
									<Button
										distinction="seamless"
										disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
										onClick={() =>
											pagesCount !== undefined && updatePaging({ type: 'goToPage', newPageIndex: pagesCount - 1 })
										}
									>
										{formatMessage('dataGrid.paging.last')}
									</Button>
								</>
							)}
						</Stack>
					</Stack>
				)}
			</Stack>
		)
	},
	props => <>{props.children}</>,
	'DataGridContainer',
)
