import { createRequiredContext, createContext } from '@contember/react-utils'
import {
	DataViewFilterHandlerRegistry,
	DataViewFilteringMethods,
	DataViewFilteringState, DataViewPagingInfo,
	DataViewPagingMethods,
	DataViewPagingState,
	DataViewSortingMethods,
	DataViewSortingState, DataViewState,
} from '../types'
import { EntityListAccessor, QualifiedEntityList } from '@contember/binding'
import { DataViewLoaderState } from './hooks/useEntityListSubTreeLoader'
import { Dispatch, SetStateAction } from 'react'

export const [DataViewSortingStateContext, useDataViewSortingState] = createRequiredContext<DataViewSortingState>('DataViewSortingStateContext')
export const [DataViewSortingMethodsContext, useDataViewSortingMethods] = createRequiredContext<DataViewSortingMethods>('DataViewSortingMethodsContext')

export const [DataViewPagingStateContext, useDataViewPagingState] = createRequiredContext<DataViewPagingState>('DataViewPagingStateContext')
export const [DataViewPagingInfoContext, useDataViewPagingInfo] = createRequiredContext<DataViewPagingInfo>('DataViewPagingInfoContext')
export const [DataViewPagingMethodsContext, useDataViewPagingMethods] = createRequiredContext<DataViewPagingMethods>('DataViewPagingMethodsContext')

export const [DataViewGlobalKeyContext, useDataViewGlobalKey] = createContext<string>('DataViewKeyGlobalContext', '')
export const [DataViewCurrentKeyContext, useDataViewCurrentKey] = createRequiredContext<string>('DataViewCurrentKeyContext')


export const [DataViewFilteringStateContext, useDataViewFilteringState] = createRequiredContext<DataViewFilteringState>('DataViewFilteringStateContext')
export const [DataViewFilteringMethodsContext, useDataViewFilteringMethods] = createRequiredContext<DataViewFilteringMethods>('DataViewFilteringMethodsContext')
export const [DataViewFilterHandlerRegistryContext, useDataViewFilterHandlerRegistry] = createRequiredContext<DataViewFilterHandlerRegistry>('DataViewFilterHandlerRegistryContext')

export const [DataViewEntityListAccessorContext, useDataViewEntityListAccessor] = createContext<EntityListAccessor | undefined>('DataViewEntityListAccessorContext', undefined)
export const [DataViewEntityListPropsContext, useDataViewEntityListProps] = createRequiredContext<QualifiedEntityList>('DataViewEntityListPropsContext')
export const [DataViewLoaderStateContext, useDataViewLoaderState] = createRequiredContext<DataViewLoaderState>('DataViewLoaderStateContext')

const DisplayedContextTmp = createRequiredContext<DataViewState | undefined>('DataViewDisplayedStateContext')

export const [DataViewDisplayedStateContext, useDataViewDisplayedState] = [
	DisplayedContextTmp[0],
	DisplayedContextTmp[1] as <T extends DataViewState>() => T,
]
