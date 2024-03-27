import { createContext, createRequiredContext } from '@contember/react-utils'
import {
	DataViewFilterHandlerRegistry,
	DataViewFilteringMethods,
	DataViewFilteringState,
	DataViewPagingInfo,
	DataViewPagingMethods,
	DataViewPagingState,
	DataViewSelectionMethods,
	DataViewSelectionState,
	DataViewSortingMethods,
	DataViewSortingState,
	DataViewState,
} from './types'
import { EntityListAccessor, QualifiedEntityList, SugaredQualifiedEntityList } from '@contember/binding'
import { EntityListSubTreeLoaderState, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'


const _DataViewSortingStateContext = createRequiredContext<DataViewSortingState>('DataViewSortingStateContext')
/** @internal */
export const DataViewSortingStateContext = _DataViewSortingStateContext[0]
export const useDataViewSortingState = _DataViewSortingStateContext[1]

const _DataViewSortingMethodsContext = createRequiredContext<DataViewSortingMethods>('DataViewSortingMethodsContext')
/** @internal */
export const DataViewSortingMethodsContext = _DataViewSortingMethodsContext[0]
export const useDataViewSortingMethods = _DataViewSortingMethodsContext[1]

const _DataViewPagingStateContext = createRequiredContext<DataViewPagingState>('DataViewPagingStateContext')
/** @internal */
export const DataViewPagingStateContext = _DataViewPagingStateContext[0]
export const useDataViewPagingState = _DataViewPagingStateContext[1]

const _DataViewPagingInfoContext = createRequiredContext<DataViewPagingInfo>('DataViewPagingInfoContext')
/** @internal */
export const DataViewPagingInfoContext = _DataViewPagingInfoContext[0]
export const useDataViewPagingInfo = _DataViewPagingInfoContext[1]

const _DataViewPagingMethodsContext = createRequiredContext<DataViewPagingMethods>('DataViewPagingMethodsContext')
/** @internal */
export const DataViewPagingMethodsContext = _DataViewPagingMethodsContext[0]
export const useDataViewPagingMethods = _DataViewPagingMethodsContext[1]

const _DataViewGlobalKeyContext = createContext<string>('DataViewKeyGlobalContext', '')
/** @internal */
export const DataViewGlobalKeyContext = _DataViewGlobalKeyContext[0]
export const useDataViewGlobalKey = _DataViewGlobalKeyContext[1]

const _DataViewCurrentKeyContext = createRequiredContext<string>('DataViewCurrentKeyContext')
/** @internal */
export const DataViewCurrentKeyContext = _DataViewCurrentKeyContext[0]
export const useDataViewCurrentKey = _DataViewCurrentKeyContext[1]

const _DataViewFilteringStateContext = createRequiredContext<DataViewFilteringState>('DataViewFilteringStateContext')
/** @internal */
export const DataViewFilteringStateContext = _DataViewFilteringStateContext[0]
export const useDataViewFilteringState = _DataViewFilteringStateContext[1]

const _DataViewFilteringMethodsContext = createRequiredContext<DataViewFilteringMethods>('DataViewFilteringMethodsContext')
/** @internal */
export const DataViewFilteringMethodsContext = _DataViewFilteringMethodsContext[0]
export const useDataViewFilteringMethods = _DataViewFilteringMethodsContext[1]

const _DataViewFilterHandlerRegistryContext = createRequiredContext<DataViewFilterHandlerRegistry>('DataViewFilterHandlerRegistryContext')
/** @internal */
export const DataViewFilterHandlerRegistryContext = _DataViewFilterHandlerRegistryContext[0]
export const useDataViewFilterHandlerRegistry = _DataViewFilterHandlerRegistryContext[1]

const _DataViewEntityListAccessorContext = createContext<EntityListAccessor | undefined>('DataViewEntityListAccessorContext', undefined)
/** @internal */
export const DataViewEntityListAccessorContext = _DataViewEntityListAccessorContext[0]
export const useDataViewEntityListAccessor = _DataViewEntityListAccessorContext[1]

const _DataViewEntityListPropsContext = createRequiredContext<QualifiedEntityList>('DataViewEntityListPropsContext')
/** @internal */
export const DataViewEntityListPropsContext = _DataViewEntityListPropsContext[0]
export const useDataViewEntityListProps = _DataViewEntityListPropsContext[1]

const _DataViewLoaderStateContext = createRequiredContext<EntityListSubTreeLoaderState>('DataViewLoaderStateContext')
/** @internal */
export const DataViewLoaderStateContext = _DataViewLoaderStateContext[0]
export const useDataViewLoaderState = _DataViewLoaderStateContext[1]

const _DataViewDisplayedContextTmp = createRequiredContext<DataViewState | undefined>('DataViewDisplayedStateContext')
/** @internal */
export const DataViewDisplayedStateContext = _DataViewDisplayedContextTmp[0]
export const useDataViewDisplayedState = _DataViewDisplayedContextTmp[1] as <T extends DataViewState>() => T

const _DataViewSelectionStateContext = createRequiredContext<DataViewSelectionState | undefined>('DataViewSelectionStateContext')
/** @internal */
export const DataViewSelectionStateContext = _DataViewSelectionStateContext[0]
export const useDataViewSelectionState = _DataViewSelectionStateContext[1]

const _DataViewSelectionMethodsContext = createRequiredContext<DataViewSelectionMethods>('DataViewSelectionMethodsContext')
/** @internal */
export const DataViewSelectionMethodsContext = _DataViewSelectionMethodsContext[0]
export const useDataViewSelectionMethods = _DataViewSelectionMethodsContext[1]


const DataViewHighlightIndexContext_ = createRequiredContext<number | null>('DataViewHighlightIndex')
/** @internal */
export const DataViewHighlightIndexContext = DataViewHighlightIndexContext_[0]
export const useDataViewHighlightIndex = DataViewHighlightIndexContext_[1]

const DataViewKeyboardEventHandlerContext_ = createRequiredContext<React.KeyboardEventHandler>('DataViewKeyboardEventHandler')
/** @internal */
export const DataViewKeyboardEventHandlerContext = DataViewKeyboardEventHandlerContext_[0]
export const useDataViewKeyboardEventHandler = DataViewKeyboardEventHandlerContext_[1]


const DataViewFilterNameContext_ = createRequiredContext<string>('DataViewFilterName')
/** @internal */
export const DataViewFilterNameContext = DataViewFilterNameContext_[0]
export const useDataViewFilterName = DataViewFilterNameContext_[1]

const DataViewRelationFilterArgsContext_ = createRequiredContext<{
	options: SugaredQualifiedEntityList['entities']
}>('DataViewRelationFilterArgs')
/** @internal */
export const DataViewRelationFilterArgsContext = DataViewRelationFilterArgsContext_[0]
export const useDataViewRelationFilterArgs = DataViewRelationFilterArgsContext_[1]
