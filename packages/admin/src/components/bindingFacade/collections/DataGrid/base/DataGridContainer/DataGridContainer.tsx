import { Component } from '@contember/binding'
import { Stack, useComponentClassName } from '@contember/ui'
import { FunctionComponent } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridDictionary } from '../dataGridDictionary'
import { useDataGridTotalCount } from '../useDataGridTotalCount'
import { DataGridContainerFooter } from './DataGridContainerFooter'
import { DataGridContainerGrid } from './DataGridContainerGrid'
import { DataGridContainerHeader } from './DataGridContainerHeader'
import { DataGridContainerTable } from './DataGridContainerTable'
import type { DataGridContainerProps } from './Types'

export const DataGridContainer: FunctionComponent<DataGridContainerProps> = Component(
	({
		accessor,
		allowAggregateFilterControls,
		allowColumnVisibilityControls,
		desiredState,
		displayedState,
		emptyMessage,
		emptyMessageComponent,
		entityName,
		filter,
		onEntityClick,
		selectedEntityKeys,
		setFilter,
		setIsColumnHidden,
		setLayout,
		setOrderBy,
		tile,
		tileSize,
		updatePaging,
	}) => {
		const componentClassName = useComponentClassName('data-grid')
		const {
			paging: { pageIndex, itemsPerPage },
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

		return (
			<Stack direction="vertical" className={`${componentClassName}-body`}>
				<DataGridContainerHeader
					allowAggregateFilterControls={allowAggregateFilterControls}
					allowColumnVisibilityControls={allowColumnVisibilityControls}
					hasTile={!!tile}
					accessor={accessor}
					pagingSummary={pagingSummary}
					desiredState={desiredState}
					setIsColumnHidden={setIsColumnHidden}
					setFilter={setFilter}
					setLayout={setLayout}
				/>
				{tile && layout === 'tiles'
					? <DataGridContainerGrid
							accessor={accessor}
							tile={tile}
							tileSize={tileSize}
						/>
					: <DataGridContainerTable
							accessor={accessor}
							desiredState={desiredState}
							displayedState={displayedState}
							emptyMessage={emptyMessage}
							emptyMessageComponent={emptyMessageComponent}
							onEntityClick={onEntityClick}
							selectedEntityKeys={selectedEntityKeys}
							setFilter={setFilter}
							setOrderBy={setOrderBy}
						/>
				}
				{!!normalizedItemCount && (
					<DataGridContainerFooter
						desiredState={desiredState}
						pagesCount={pagesCount}
						pagingSummary={pagingSummary}
						updatePaging={updatePaging}
					/>
				)}
			</Stack>
		)
	},
	props => <>{props.children}</>,
	'DataGridContainer',
)
