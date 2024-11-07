import * as React from 'react'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
	DataViewInfiniteLoadAccessorsContext,
	DataViewInfiniteLoadTriggerContext,
	useDataViewDisplayedState,
	useDataViewEntityListAccessor,
	useDataViewFilteringState,
	useDataViewPagingInfo,
	useDataViewPagingMethods,
	useDataViewPagingState,
	useDataViewSortingState,
} from '../../contexts'
import { Component, EntityListAccessor } from '@contember/react-binding'

export const DataViewInfiniteLoadProvider = Component(({ children }: {
	children: ReactNode
}) => {
	const entityList = useDataViewEntityListAccessor()
	const displayedState = useDataViewDisplayedState()
	const filteringState = useDataViewFilteringState()
	const sortingState = useDataViewSortingState()
	const pagingState = useDataViewPagingState()
	const { goToPage } = useDataViewPagingMethods()
	const { pagesCount } = useDataViewPagingInfo()

	const [accessors, setAccessors] = useState<EntityListAccessor[]>([])

	const isInfiniteScroll = useRef(false)
	const stateChanged = useRef(false)

	useEffect(() => {
		stateChanged.current = true
	}, [filteringState])

	useEffect(() => {
		stateChanged.current = true
	}, [sortingState])

	useEffect(() => {
		if (isInfiniteScroll.current) {
			isInfiniteScroll.current = false
			return
		}
		stateChanged.current = true
	}, [pagingState])

	useEffect(() => {
		if (entityList) {
			if (stateChanged.current) {
				setAccessors([entityList])
			} else {
				setAccessors(it => [...it, entityList])
			}
			stateChanged.current = false
		}
	}, [entityList])


	const nextPage = displayedState ? displayedState.paging.pageIndex + 1 : 0

	const loadMore = useCallback(() => {
		isInfiniteScroll.current = true
		goToPage(nextPage)
	}, [goToPage, nextPage])

	return <>
		<DataViewInfiniteLoadAccessorsContext.Provider value={accessors}>
			<DataViewInfiniteLoadTriggerContext.Provider value={pagesCount !== undefined && nextPage >= pagesCount ? undefined : loadMore}>
				{children}
			</DataViewInfiniteLoadTriggerContext.Provider>
		</DataViewInfiniteLoadAccessorsContext.Provider>
	</>

}, ({ children }) => <>
	{children}
</>)
