import { Component, Entity, EntityListBaseProps, EntityName, Filter } from '@contember/binding'
import { Button, ButtonList, Divider, Grid, Icon, LayoutPageStickyContainer, Stack, Table, TableCell, TableRow } from '@contember/ui'
import { ComponentType, FunctionComponent, ReactNode, useCallback } from 'react'
import { useMessageFormatter } from '../../../../../i18n'
import { EmptyMessage, EmptyMessageProps } from '../../helpers'
import type { GridPagingAction } from '../paging'
import { DataGridColumnHiding } from './DataGridColumnHiding'
import { dataGridDictionary } from './dataGridDictionary'
import { DataGridFullFilters } from './DataGridFullFilters'
import { DataGridHeaderCell } from './DataGridHeaderCell'
import { SetDataGridView } from './DataGridLayout'
import type { DataGridSetColumnFilter } from './DataGridSetFilter'
import type { DataGridSetIsColumnHidden } from './DataGridSetIsColumnHidden'
import type { DataGridSetColumnOrderBy } from './DataGridSetOrderBy'
import type { DataGridState } from './DataGridState'
import { getColumnFilter } from './getColumnFilter'
import { useDataGridTotalCount } from './useDataGridTotalCount'

export interface DataGridContainerPublicProps {
	allowColumnVisibilityControls?: boolean
	allowAggregateFilterControls?: boolean

	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}

	tile?: ReactNode
	tileSize?: number
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
	setLayout: SetDataGridView
}

export interface DataGridContainerProps extends DataGridContainerOwnProps, EntityListBaseProps {}

export const DataGridContainer: FunctionComponent<DataGridContainerProps> = Component(
	({
		children,
		accessor,
		setFilter,
		setIsColumnHidden,
		setOrderBy,
		setLayout,
		updatePaging,
		desiredState,
		displayedState,
		entityName,
		filter,

		allowAggregateFilterControls,
		allowColumnVisibilityControls,
		emptyMessage,
		emptyMessageComponent,
		tile,
		tileSize = 160,
	}) => {
		const {
			paging: { pageIndex, itemsPerPage },
			filterArtifacts,
			orderDirections,
			columns,
			layout,
		} = desiredState
		const formatMessage = useMessageFormatter(dataGridDictionary)
		const totalCount = useDataGridTotalCount(entityName, filter)
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

		const setDefaultView = useCallback(() => setLayout('default'), [setLayout])
		const setTileView = useCallback(() => setLayout('tiles'), [setLayout])

		return (
			<Stack direction="vertical">
				<LayoutPageStickyContainer
					left="var(--cui-layout-page-padding-left)"
					right="var(--cui-layout-page-padding-right)"
				>
					<Stack wrap align="center" direction="horizontal" justify="space-between">
						<Stack gap="small" direction="horizontal">
							{tile && <>
								<ButtonList>
									<Button onClick={setTileView} size="small" distinction="seamless" intent={layout === 'tiles' ? 'primary' : 'default'}>
										<Icon blueprintIcon="grid-view" />
									</Button>
									<Button onClick={setDefaultView} size="small" distinction="seamless" intent={layout === 'default' ? 'primary' : 'default'}>
										<Icon blueprintIcon="list" />
									</Button>
								</ButtonList>

								<Divider />
							</>}
							{layout !== 'tiles' && allowColumnVisibilityControls !== false && (
									<DataGridColumnHiding
										desiredState={desiredState}
										formatMessage={formatMessage}
										setIsColumnHidden={setIsColumnHidden}
									/>
								)
							}
							{allowAggregateFilterControls !== false && (
								<DataGridFullFilters
									desiredState={desiredState}
									environment={accessor.environment}
									formatMessage={formatMessage}
									setFilter={setFilter}
								/>
							)}
						</Stack>
						<div>{pagingSummary}</div>
					</Stack>
				</LayoutPageStickyContainer>
				{tile && layout === 'tiles'
					? <Grid columnWidth={tileSize}>
						{!!accessor.length && Array.from(accessor, entity => (
							<Entity
								key={entity.key}
								accessor={entity}
							>
								{tile}
							</Entity>
						))}
					</Grid>
					: <Table
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
					</Table>}
				{!!normalizedItemCount && <LayoutPageStickyContainer
					left="var(--cui-layout-page-padding-left)"
					right="var(--cui-layout-page-padding-right)"
				>
					<Stack wrap align="center" direction="horizontal" justify="space-between">
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
						<div>{pagingSummary}</div>
					</Stack>
				</LayoutPageStickyContainer>}
			</Stack>
		)
	},
	props => <>{props.children}</>,
	'DataGridContainer',
)
