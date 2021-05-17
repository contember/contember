import { Component, Entity, EntityListBaseProps, EntityName, Filter } from '@contember/binding'
import { Button, ButtonList, Justification, Table, TableCell, TableRow } from '@contember/ui'
import { ComponentType, FunctionComponent, ReactNode } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { EmptyMessage, EmptyMessageProps } from '../../helpers'
import { GridPagingAction } from '../paging'
import { DataGridColumnHiding } from './DataGridColumnHiding'
import { dataGridDictionary } from './dataGridDictionary'
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
		emptyMessage,
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
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
			<div>
				<div style={{ display: 'flex', justifyContent: 'space-between', gap: '1em', flexWrap: 'wrap' }}>
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
								<EmptyMessageComponent {...emptyMessageComponentExtraProps}>
									{formatMessage(emptyMessage, 'dataGrid.emptyMessage.text')}
								</EmptyMessageComponent>
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
								{formatMessage('dataGrid.paging.first')}
							</Button>
							<Button disabled={pageIndex === 0} onClick={() => updatePaging({ type: 'goToPreviousPage' })}>
								{formatMessage('dataGrid.paging.previous')}
							</Button>
							{itemsPerPage !== null && (
								<>
									<Button
										disabled={accessor.length !== itemsPerPage}
										onClick={() => updatePaging({ type: 'goToNextPage' })}
									>
										{formatMessage('dataGrid.paging.next')}
									</Button>
									<Button
										distinction="seamless"
										disabled={pagesCount === undefined || pageIndex === pagesCount - 1}
										onClick={() =>
											pagesCount !== undefined && updatePaging({ type: 'goToPage', newPageIndex: pagesCount - 1 })
										}
									>
										{formatMessage('dataGrid.paging.last')}
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
