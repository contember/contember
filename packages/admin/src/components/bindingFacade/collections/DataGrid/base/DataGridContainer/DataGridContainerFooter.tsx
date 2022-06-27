import { Button, LayoutPageStickyContainer, Stack } from '@contember/ui'
import { memo, ReactNode, useCallback } from 'react'
import { useMessageFormatter } from '../../../../../../i18n'
import { dataGridDictionary } from '../dataGridDictionary'
import type { DataGridContainerProps } from './Types'

type DataGridContainerFooterProps =
	& Pick<DataGridContainerProps,
		| 'desiredState'
		| 'updatePaging'
	>
	& {
		pagesCount?: number
		pagingSummary: ReactNode
	}

export const DataGridContainerFooter = memo<DataGridContainerFooterProps>(({
  desiredState,
  pagesCount,
  pagingSummary,
  updatePaging,
}) => {
  const { paging: { pageIndex, itemsPerPage } } = desiredState

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

	return (
		<LayoutPageStickyContainer
			left="var(--cui-layout-page-padding-left)"
			right="var(--cui-layout-page-padding-right)"
		>
			<Stack wrap align="center" direction="horizontal" justify="space-between">
				<Stack direction="horizontal" justify="space-between" gap="small">
					<Button
						distinction="seamless"
						disabled={pageIndex === 0}
						onClick={goToFirstPageClick}
					>
						{formatMessage('dataGrid.paging.first')}
					</Button>
					<Button
						disabled={pageIndex === 0}
						onClick={goToPreviousPageClick}
					>
						{formatMessage('dataGrid.paging.previous')}
					</Button>
					{itemsPerPage !== null && (
						<>
							<Button
								disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
								onClick={goToNextPageClick}
							>
								{formatMessage('dataGrid.paging.next')}
							</Button>
							<Button
								distinction="seamless"
								disabled={pagesCount === undefined || pagesCount <= pageIndex + 1}
								onClick={goToLastPageClick}
							>
								{formatMessage('dataGrid.paging.last')}
							</Button>
						</>
					)}
				</Stack>
				<div>{pagingSummary}</div>
			</Stack>
		</LayoutPageStickyContainer>
	)
})
DataGridContainerFooter.displayName = 'DataGridContainerFooter'
