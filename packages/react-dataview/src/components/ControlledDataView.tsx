import { ReactNode, useState } from 'react'
import {
	DataViewChildrenContext,
	DataViewCurrentKeyContext,
	DataViewEntityListPropsContext,
	DataViewFilterHandlerRegistryContext,
	DataViewFilteringMethodsContext,
	DataViewFilteringStateContext,
	DataViewPagingInfoContext,
	DataViewPagingMethodsContext,
	DataViewPagingStateContext,
	DataViewSelectionMethodsContext,
	DataViewSelectionStateContext,
	DataViewSortingMethodsContext,
	DataViewSortingStateContext,
} from '../contexts'
import { Component, EntityAccessor, EnvironmentMiddleware } from '@contember/react-binding'
import { DataViewLoader } from '../internal/components/DataViewLoader'
import { DataViewInfo, DataViewMethods, DataViewState } from '../types'
import { dataViewSelectionEnvironmentExtension } from '../env/dataViewSelectionEnvironmentExtension'


export type ControlledDataViewProps =
	& {
		children: ReactNode
		state: DataViewState
		info: DataViewInfo
		methods: DataViewMethods
		onSelectHighlighted?: (entity: EntityAccessor) => void
	}

export const ControlledDataView = Component<ControlledDataViewProps>(({ state, info, methods, children, onSelectHighlighted }) => {
	const [childrenStable] = useState(children)
	return (
		<DataViewChildrenContext.Provider value={childrenStable}>
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
													<DataViewSelectionMethodsContext.Provider value={methods.selection}>
														<DataViewSelectionStateContext.Provider value={state.selection}>
															<EnvironmentMiddleware create={it => it.withExtension(dataViewSelectionEnvironmentExtension, state.selection.values)}>
																<DataViewLoader children={children} state={state} onSelectHighlighted={onSelectHighlighted} />
															</EnvironmentMiddleware>
														</DataViewSelectionStateContext.Provider>
													</DataViewSelectionMethodsContext.Provider>
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
		</DataViewChildrenContext.Provider>
	)
}, () => {
	return null
})
