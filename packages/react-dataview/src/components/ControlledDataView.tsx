import { ReactNode } from 'react'
import {
	DataViewCurrentKeyContext,
	DataViewEntityListPropsContext,
	DataViewFilterHandlerRegistryContext,
	DataViewFilteringMethodsContext,
	DataViewFilteringStateContext,
	DataViewPagingInfoContext,
	DataViewPagingMethodsContext,
	DataViewPagingStateContext, DataViewSortingMethodsContext, DataViewSortingStateContext,
} from '../internal/contexts'
import { Component } from '@contember/react-binding'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { DataViewInfo, DataViewMethods, DataViewState } from '../types'


export type ControlledDataViewProps =
	& {
		children: ReactNode
		state: DataViewState
		info: DataViewInfo
		methods: DataViewMethods
	}

export const ControlledDataView = Component<ControlledDataViewProps>(({ state, info, methods, children }) => {
	return (
		<DataViewEntityListPropsContext.Provider value={state.entities}>
			<DataViewCurrentKeyContext.Provider value={state.key}>
				<DataViewPagingStateContext.Provider value={state.paging}>
					<DataViewPagingInfoContext.Provider value={info.paging}>
						<DataViewPagingMethodsContext.Provider value={methods.paging}>
							<DataViewSortingStateContext.Provider value={state.sorting}>
								<DataViewSortingMethodsContext.Provider value={methods.sorting}>
									<DataViewFilterHandlerRegistryContext.Provider value={state.filtering.filterTypes ?? {}}>
										<DataViewFilteringStateContext.Provider value={state.filtering}>
											<DataViewFilteringMethodsContext.Provider value={methods.filtering}>
												<DataViewLoader children={children} state={state} />
											</DataViewFilteringMethodsContext.Provider>
										</DataViewFilteringStateContext.Provider>
									</DataViewFilterHandlerRegistryContext.Provider>
								</DataViewSortingMethodsContext.Provider>
							</DataViewSortingStateContext.Provider>
						</DataViewPagingMethodsContext.Provider>
					</DataViewPagingInfoContext.Provider>
				</DataViewPagingStateContext.Provider>
			</DataViewCurrentKeyContext.Provider>
		</DataViewEntityListPropsContext.Provider>
	)
}, () => {
	return null
})
