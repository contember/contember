import * as React from 'react'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
	DataViewInfiniteLoadAccessorsContext,
	DataViewInfiniteLoadTriggerContext,
	useDataViewDisplayedState,
	useDataViewEntityListAccessor,
	useDataViewPagingInfo,
	useDataViewPagingMethods,
} from '../../contexts'
import { Component, EntityListAccessor, EntityListSubTreeMarker, QualifiedEntityList } from '@contember/react-binding'
import deepEqual from 'fast-deep-equal'

export const DataViewInfiniteLoadProvider = Component(({ children }: {
	children: ReactNode
}) => {
	const entityList = useDataViewEntityListAccessor()
	const displayedPage = useDataViewDisplayedState()?.paging.pageIndex
	const { goToPage } = useDataViewPagingMethods()
	const { pagesCount } = useDataViewPagingInfo()

	const [accessors, setAccessors] = useState<EntityListAccessor[]>([])

	const expectedInfiniteScrollPage = useRef<number | null>(null)
	const previousEntityListParams = useRef<QualifiedEntityList | null>(null)


	useEffect(() => {
		if (!entityList) {
			return
		}
		const entityListParams = (entityList.getMarker() as EntityListSubTreeMarker).parameters as QualifiedEntityList
		const isInfiniteLoad = displayedPage === expectedInfiniteScrollPage.current
			&& previousEntityListParams.current
			&& deepEqual(previousEntityListParams.current.filter, entityListParams.filter)
			&& deepEqual(previousEntityListParams.current.orderBy, entityListParams.orderBy)
			&& previousEntityListParams.current.limit === entityListParams.limit
			&& previousEntityListParams.current.offset === ((entityListParams.offset ?? 0) - (entityListParams.limit ?? 0))

		setAccessors(it => isInfiniteLoad ? [...it, entityList] : [entityList])
		expectedInfiniteScrollPage.current = null
		previousEntityListParams.current = entityListParams
	}, [entityList, displayedPage])


	const nextPage = (displayedPage ?? -1) + 1

	const loadMore = useCallback(() => {
		expectedInfiniteScrollPage.current = nextPage
		goToPage(nextPage)
	}, [goToPage, nextPage])

	return <>
		<DataViewInfiniteLoadAccessorsContext.Provider value={accessors}>
			<DataViewInfiniteLoadTriggerContext.Provider value={pagesCount === undefined || nextPage >= pagesCount ? undefined : loadMore}>
				{children}
			</DataViewInfiniteLoadTriggerContext.Provider>
		</DataViewInfiniteLoadAccessorsContext.Provider>
	</>

}, ({ children }) => <>
	{children}
</>)
