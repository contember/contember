import { dataGridDictionary } from '../dict/dataGridDictionary'
import { useMessageFormatter } from '@contember/react-i18n'
import { useDataViewPagingInfo, useDataViewPagingState } from '@contember/react-dataview'

export const DataGridPagingSummary = () => {
	const pagingInfo = useDataViewPagingInfo()
	const pagingState = useDataViewPagingState()
	const pageIndex = pagingState.pageIndex

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
