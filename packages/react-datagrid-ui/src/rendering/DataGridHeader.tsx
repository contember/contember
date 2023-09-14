import { LayoutPageStickyContainer, Stack } from '@contember/ui'
import { memo } from 'react'
import { DataGridColumnHiding, DataGridColumnHidingPublicProps } from './DataGridColumnHiding'
import { DataGridFullFilters, DataGridFullFiltersPublicProps } from './DataGridFullFilters'
import { DataGridRenderingCommonProps } from '../types'
import { DataGridLayoutControl, DataGridLayoutControlPublicProps } from './DataGridLayoutControl'
import { DataGridPagingSummary } from './DataGridPagingSummary'

export type DataGridHeaderPublicProps =
	& DataGridLayoutControlPublicProps
	& DataGridColumnHidingPublicProps
	& DataGridFullFiltersPublicProps

export type DataGridHeaderProps =
	& DataGridRenderingCommonProps
	& DataGridHeaderPublicProps

export const DataGridHeader = memo<DataGridHeaderProps>(props => {
	return (
		<LayoutPageStickyContainer
			left="var(--cui-layout-page-padding-left)"
			right="var(--cui-layout-page-padding-right)"
		>
			<Stack wrap align="center" horizontal justify="space-between">
				<Stack gap="gutter" horizontal>
					<DataGridLayoutControl {...props} />
					<DataGridColumnHiding {...props} />
					<DataGridFullFilters {...props} />
				</Stack>
				<div><DataGridPagingSummary {...props} /></div>
			</Stack>
		</LayoutPageStickyContainer>
	)
})
DataGridHeader.displayName = 'DataGridHeader'
