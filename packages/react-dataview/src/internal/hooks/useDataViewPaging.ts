import { useEffect, useMemo, useState } from 'react'
import { useSessionStorageState, useStoredState } from '@contember/react-utils'
import { DataViewPagingInfo, DataViewPagingMethods, DataViewPagingProps, DataViewPagingState } from '../../types'
import { useDataViewTotalCount } from './useDataViewTotalCount'
import { Filter, QualifiedEntityList } from '@contember/binding'
import { DataViewCurrentPageStoredState, getDataViewCurrentPageStorageArgs, getDataViewPagingSettingStorageArgs } from '../stateStorage'

type UseDataViewPagingArgs =
	& {
		dataViewKey?: string
		filter: Filter<never>
		entities: QualifiedEntityList
	}
	& DataViewPagingProps

export const DATA_VIEW_DEFAULT_ITEMS_PER_PAGE = 50

export const useDataViewPaging = ({ dataViewKey, initialItemsPerPage, pagingSettingsStorage, currentPageStateStorage, ...args }: UseDataViewPagingArgs): {
	state: DataViewPagingState
	info: DataViewPagingInfo
	methods: DataViewPagingMethods
} => {
	const [currentPageState, setCurrentPageState] = useStoredState<DataViewCurrentPageStoredState>(
		currentPageStateStorage ?? 'null',
		...getDataViewCurrentPageStorageArgs({
			dataViewKey,
		}),
	)

	const [pagingSettingsState, setPagingSettingsState] = useStoredState<Pick<DataViewPagingState, 'itemsPerPage'>>(
		pagingSettingsStorage ?? 'null',
		...getDataViewPagingSettingStorageArgs({
			dataViewKey,
			initialItemsPerPage,
		},
		),
	)


	const pagingState = useMemo(() => {
		return {
			...pagingSettingsState,
			...currentPageState,
		}
	}, [pagingSettingsState, currentPageState])

	const [pagingInfo, setPagingInfo] = useState<DataViewPagingInfo>({
		pagesCount: undefined,
		totalCount: undefined,
	})

	const itemsPerPage = pagingState.itemsPerPage
	const totalCount = useDataViewTotalCount(args)
	const pagesCount = totalCount !== undefined && itemsPerPage !== null ? Math.ceil(totalCount / itemsPerPage) : undefined
	useEffect(() => {
		setPagingInfo({
			pagesCount,
			totalCount,
		})
	}, [pagesCount, totalCount])

	return {
		state: pagingState,
		info: pagingInfo,
		methods: useMemo(() => {
			return {
				setItemsPerPage: (newItemsPerPage: number | null) => {
					setPagingSettingsState(val => {
						if (val.itemsPerPage === newItemsPerPage) {
							return val
						}
						return {
							...val,
							itemsPerPage: newItemsPerPage,
						}
					})
				},
				goToPage: (page: number | 'first' | 'next' | 'previous' | 'last') => {

					setCurrentPageState(val => {
						const newPage = (() => {
							const current = val.pageIndex
							switch (page) {
								case 'first':
									return 0
								case 'next':
									return current + 1
								case 'previous':
									return Math.max(0, current - 1)
								case 'last':
									if (pagesCount === undefined) {
										return current
									}
									return pagesCount - 1
								default:
									return page
							}
						})()

						if (val.pageIndex === newPage) {
							return val
						}
						return {
							...val,
							pageIndex: newPage,
						}
					})
				},
			}
		}, [pagesCount, setCurrentPageState, setPagingSettingsState]),
	}
}
