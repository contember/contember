import { Button, LayoutPageStickyContainer, Stack } from '@contember/ui'
import { memo, useCallback } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridDictionary } from '../dict/dataGridDictionary'
import { DataGridRenderingCommonProps } from '../types'
import { DataGridPagingSummary } from './DataGridPagingSummary'

export type DataGridFooterPublicProps = {}

export type DataGridFooterProps =
	& DataGridFooterPublicProps
	& DataGridRenderingCommonProps

export const DataGridFooter = memo<DataGridFooterProps>(props => {

	const {
		desiredState: { paging: { pageIndex, itemsPerPage } },
		pagingInfo: { totalCount, pagesCount },
		stateMethods: { updatePaging },
	} = props

	const formatMessage = useMessageFormatter(dataGridDictionary)

	const goToFirstPageClick = useCallback(() => {
		updatePaging({ type: 'goToFirstPage' })
	}, [updatePaging])
	const goToPreviousPageClick = useCallback(() => {
		updatePaging({ type: 'goToPreviousPage' })
	}, [updatePaging])
	const goToNextPageClick = useCallback(() => {
		updatePaging({ type: 'goToNextPage' })
	}, [updatePaging])
	const goToLastPageClick = useCallback(() => {
		pagesCount !== undefined && updatePaging({ type: 'goToPage', newPageIndex: pagesCount - 1 })
	}, [pagesCount, updatePaging])

	if (!pagesCount || pagesCount <= 1) {
		return null
	}

	return (
		<LayoutPageStickyContainer
			left="var(--cui-layout-page--padding-left)"
			right="var(--cui-layout-page--padding-right)"
		>
			<Stack wrap align="center" horizontal justify="space-between">
				<Stack horizontal justify="space-between" gap="gap">
					<Button
						distinction="seamless"
						inset={false}
						disabled={pageIndex === 0}
						onClick={goToFirstPageClick}
					>
						{formatMessage('dataGrid.paging.first')}
					</Button>
					<Button
						inset={false}
						disabled={pageIndex === 0}
						onClick={goToPreviousPageClick}
					>
						{formatMessage('dataGrid.paging.previous')}
					</Button>
					{itemsPerPage !== null && (
						<>
							<Button
								inset={false}
								disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
								onClick={goToNextPageClick}
							>
								{formatMessage('dataGrid.paging.next')}
							</Button>
							<Button
								inset={false}
								distinction="seamless"
								disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
								onClick={goToLastPageClick}
							>
								{formatMessage('dataGrid.paging.last')}
							</Button>
						</>
					)}
				</Stack>
				<div><DataGridPagingSummary {...props} /></div>
			</Stack>
		</LayoutPageStickyContainer>
	)
})
DataGridFooter.displayName = 'DataGridFooter'
