import { createNonNullableContextFactory, createOptionalContextFactory } from '@contember/react-utils'
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

export const [DataViewSortingStateContext, useDataViewSortingState] = createNonNullableContextFactory<DataViewSortingState>('DataViewSortingStateContext')
export const [DataViewSortingMethodsContext, useDataViewSortingMethods] = createNonNullableContextFactory<DataViewSortingMethods>('DataViewSortingMethodsContext')

export const [DataViewPagingStateContext, useDataViewPagingState] = createNonNullableContextFactory<DataViewPagingState>('DataViewPagingStateContext')
export const [DataViewPagingInfoContext, useDataViewPagingInfo] = createNonNullableContextFactory<DataViewPagingInfo>('DataViewPagingInfoContext')
export const [DataViewPagingMethodsContext, useDataViewPagingMethods] = createNonNullableContextFactory<DataViewPagingMethods>('DataViewPagingMethodsContext')

export const [DataViewGlobalKeyContext, useDataViewGlobalKey] = createOptionalContextFactory<string>('DataViewKeyGlobalContext', '')
export const [DataViewCurrentKeyContext, useDataViewCurrentKey] = createNonNullableContextFactory<string>('DataViewCurrentKeyContext')


export const [DataViewFilteringStateContext, useDataViewFilteringState] = createNonNullableContextFactory<DataViewFilteringState>('DataViewFilteringStateContext')
export const [DataViewFilteringMethodsContext, useDataViewFilteringMethods] = createNonNullableContextFactory<DataViewFilteringMethods>('DataViewFilteringMethodsContext')
export const [DataViewFilterHandlerRegistryContext, useDataViewFilterHandlerRegistry] = createNonNullableContextFactory<DataViewFilterHandlerRegistry>('DataViewFilterHandlerRegistryContext')

export const [DataViewEntityListAccessorContext, useDataViewEntityListAccessor] = createOptionalContextFactory<EntityListAccessor | undefined>('DataViewEntityListAccessorContext', undefined)
export const [DataViewEntityListPropsContext, useDataViewEntityListProps] = createNonNullableContextFactory<QualifiedEntityList>('DataViewEntityListPropsContext')
export const [DataViewLoaderStateContext, useDataViewLoaderState] = createNonNullableContextFactory<DataViewLoaderState>('DataViewLoaderStateContext')

const DisplayedContextTmp = createNonNullableContextFactory<DataViewState | undefined>('DataViewDisplayedStateContext')

export const [DataViewDisplayedStateContext, useDataViewDisplayedState] = [
	DisplayedContextTmp[0],
	DisplayedContextTmp[1] as <T extends DataViewState>() => T,
]
