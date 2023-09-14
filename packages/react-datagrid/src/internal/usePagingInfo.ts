import { EntityName, Filter } from '@contember/react-binding'
import { useDataGridTotalCount } from './useDataGridTotalCount'
import { GridPagingInfo } from '../types'

export const usePagingInfo = ({ entityName, filter, itemsPerPage }: {
	entityName: EntityName,
	itemsPerPage: number | null,
	filter: Filter | undefined
}): GridPagingInfo => {
	const totalCount = useDataGridTotalCount(entityName, filter)
	const pagesCount = totalCount !== undefined && itemsPerPage !== null ? Math.ceil(totalCount / itemsPerPage) : undefined
	return { totalCount, pagesCount }
}
