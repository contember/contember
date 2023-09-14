import { dataGridDictionary } from '../dict/dataGridDictionary'
import { DataGridRenderingCommonProps } from '../types'
import { useMessageFormatter } from '@contember/react-i18n'

export type DataGridPagingSummaryProps =
	& DataGridRenderingCommonProps

export const DataGridPagingSummary = ({ pagingInfo, displayedState: { paging: { pageIndex } } }: DataGridPagingSummaryProps) => {
	const formatMessage = useMessageFormatter(dataGridDictionary)

	const pageCount = pagingInfo.pagesCount === undefined
		? formatMessage('dataGrid.paging.status.unknownPageTotal', { pageNumber: pageIndex + 1 })
		: formatMessage('dataGrid.paging.status.knownPageTotal', {
			pageNumber: pageIndex + 1,
			totalPageCount: pagingInfo.pagesCount,
		})

	const itemCount = pagingInfo.totalCount !== undefined
		? formatMessage('dataGrid.paging.status.itemCount', { itemCount: pagingInfo.totalCount })
		: ''

	return <>{pageCount}{' '}{itemCount}</>
}
