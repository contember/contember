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
import { EntityListAccessor, QualifiedEntityList, SugaredQualifiedEntityList } from '@contember/react-binding'
import { EntityListSubTreeLoaderState, SugaredRelativeSingleField } from '@contember/react-binding'
import * as React from 'react'
import { ReactNode } from 'react'


const _DataViewSortingStateContext = createRequiredContext<DataViewSortingState>('DataViewSortingStateContext')
/** @internal */
export const DataViewSortingStateContext = _DataViewSortingStateContext[0]
/**
 * Provides the desired sorting state. See {@link DataViewSortingState}.
 */
export const useDataViewSortingState = _DataViewSortingStateContext[1]

const _DataViewSortingMethodsContext = createRequiredContext<DataViewSortingMethods>('DataViewSortingMethodsContext')
/** @internal */
export const DataViewSortingMethodsContext = _DataViewSortingMethodsContext[0]
/**
 * Provides methods to change the sorting state. See {@link DataViewSortingMethods}.
 */
export const useDataViewSortingMethods = _DataViewSortingMethodsContext[1]

const _DataViewPagingStateContext = createRequiredContext<DataViewPagingState>('DataViewPagingStateContext')
/** @internal */
export const DataViewPagingStateContext = _DataViewPagingStateContext[0]
/**
 * Provides the desired paging state. See {@link DataViewPagingState}.
 */
export const useDataViewPagingState = _DataViewPagingStateContext[1]

const _DataViewPagingInfoContext = createRequiredContext<DataViewPagingInfo>('DataViewPagingInfoContext')
/** @internal */
export const DataViewPagingInfoContext = _DataViewPagingInfoContext[0]
/**
 * Provides the paging info (total rows count and page count). See {@link DataViewPagingInfo}.
 */
export const useDataViewPagingInfo = _DataViewPagingInfoContext[1]

const _DataViewPagingMethodsContext = createRequiredContext<DataViewPagingMethods>('DataViewPagingMethodsContext')
/** @internal */
export const DataViewPagingMethodsContext = _DataViewPagingMethodsContext[0]
/**
 * Provides methods to change the paging state (page and items per page). See {@link DataViewPagingMethods}.
 */
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
/**
 * Provides the desired filtering state. See {@link DataViewFilteringState}.
 */
export const useDataViewFilteringState = _DataViewFilteringStateContext[1]

const _DataViewFilteringMethodsContext = createRequiredContext<DataViewFilteringMethods>('DataViewFilteringMethodsContext')
/** @internal */
export const DataViewFilteringMethodsContext = _DataViewFilteringMethodsContext[0]
/**
 * Provides methods to change the filtering state. See {@link DataViewFilteringMethods}.
 */
export const useDataViewFilteringMethods = _DataViewFilteringMethodsContext[1]

const _DataViewFilterHandlerRegistryContext = createRequiredContext<DataViewFilterHandlerRegistry>('DataViewFilterHandlerRegistryContext')
/** @internal */
export const DataViewFilterHandlerRegistryContext = _DataViewFilterHandlerRegistryContext[0]
export const useDataViewFilterHandlerRegistry = _DataViewFilterHandlerRegistryContext[1]

const _DataViewEntityListAccessorContext = createContext<EntityListAccessor | undefined>('DataViewEntityListAccessorContext', undefined)
/** @internal */
export const DataViewEntityListAccessorContext = _DataViewEntityListAccessorContext[0]
/**
 * Provides the current entity list accessor for the data view.
 */
export const useDataViewEntityListAccessor = _DataViewEntityListAccessorContext[1]

const _DataViewEntityListPropsContext = createRequiredContext<QualifiedEntityList>('DataViewEntityListPropsContext')
/** @internal */
export const DataViewEntityListPropsContext = _DataViewEntityListPropsContext[0]
/**
 * Provides currently displayed entity list props.
 */
export const useDataViewEntityListProps = _DataViewEntityListPropsContext[1]

const _DataViewLoaderStateContext = createRequiredContext<Exclude<EntityListSubTreeLoaderState, 'loading'>>('DataViewLoaderStateContext')
/** @internal */
export const DataViewLoaderStateContext = _DataViewLoaderStateContext[0]
/**
 * Lower-level state of the data view loader.
 */
export const useDataViewLoaderState = _DataViewLoaderStateContext[1]

const _DataViewReloadContext = createRequiredContext<() => void>('DataViewReloadContext')
/** @internal */
export const DataViewReloadContext = _DataViewReloadContext[0]
/**
 * Provides a function to reload the data view.
 */
export const useDataViewReload = _DataViewReloadContext[1]

const _DataViewDisplayedContextTmp = createRequiredContext<DataViewState | undefined>('DataViewDisplayedStateContext')
/** @internal */
export const DataViewDisplayedStateContext = _DataViewDisplayedContextTmp[0]
/**
 * Provides the displayed state of the data view. This is the state that matches the displayed data, not desired state.
 */
export const useDataViewDisplayedState = _DataViewDisplayedContextTmp[1] as <T extends DataViewState>() => T | undefined

const _DataViewSelectionStateContext = createRequiredContext<DataViewSelectionState>('DataViewSelectionStateContext')
/** @internal */
export const DataViewSelectionStateContext = _DataViewSelectionStateContext[0]
/**
 * Provides the desired selection state.
 */
export const useDataViewSelectionState = _DataViewSelectionStateContext[1]

const _DataViewSelectionMethodsContext = createRequiredContext<DataViewSelectionMethods>('DataViewSelectionMethodsContext')
/** @internal */
export const DataViewSelectionMethodsContext = _DataViewSelectionMethodsContext[0]
/**
 * Provides methods to change the selection state (layout and visibility).
 */
export const useDataViewSelectionMethods = _DataViewSelectionMethodsContext[1]


const DataViewHighlightIndexContext_ = createRequiredContext<number | null>('DataViewHighlightIndex')
/** @internal */
export const DataViewHighlightIndexContext = DataViewHighlightIndexContext_[0]
/**
 * Provides the index of the highlighted row.
 */
export const useDataViewHighlightIndex = DataViewHighlightIndexContext_[1]

const DataViewKeyboardEventHandlerContext_ = createRequiredContext<React.KeyboardEventHandler>('DataViewKeyboardEventHandler')
/** @internal */
export const DataViewKeyboardEventHandlerContext = DataViewKeyboardEventHandlerContext_[0]
export const useDataViewKeyboardEventHandler = DataViewKeyboardEventHandlerContext_[1]


const DataViewFilterNameContext_ = createRequiredContext<string>('DataViewFilterName')
/** @internal */
export const DataViewFilterNameContext = DataViewFilterNameContext_[0]
/**
 * Provides the name of the filter in current context.
 */
export const useDataViewFilterName = DataViewFilterNameContext_[1]

const DataViewRelationFilterArgsContext_ = createRequiredContext<{
	options: SugaredQualifiedEntityList['entities']
}>('DataViewRelationFilterArgs')
/** @internal */
export const DataViewRelationFilterArgsContext = DataViewRelationFilterArgsContext_[0]
export const useDataViewRelationFilterArgs = DataViewRelationFilterArgsContext_[1]


const DataViewChildrenContext_ = createRequiredContext<ReactNode>('DataViewChildren')
/** @internal */
export const DataViewChildrenContext = DataViewChildrenContext_[0]
/**
 * Provides the children of the data view.
 */
export const useDataViewChildren = DataViewChildrenContext_[1]

const DataViewInfiniteLoadAccessorsContext_ = createRequiredContext<EntityListAccessor[]>('DataViewInfiniteLoadAccessorsContext')
/** @internal */
export const DataViewInfiniteLoadAccessorsContext = DataViewInfiniteLoadAccessorsContext_[0]
export const useDataViewInfiniteLoadAccessors = DataViewInfiniteLoadAccessorsContext_[1]

const DataViewInfiniteLoadTriggerContext_ = createRequiredContext<(() => void) | undefined>('DataViewInfiniteLoadTriggerContext')
/** @internal */
export const DataViewInfiniteLoadTriggerContext = DataViewInfiniteLoadTriggerContext_[0]
export const useDataViewInfiniteLoadTrigger = DataViewInfiniteLoadTriggerContext_[1]


const DataViewEnumFilterArgsContext_ = createRequiredContext<{
	enumName: string
}>('DataViewEnumFilterArgsContext')
/** @internal */
export const DataViewEnumFilterArgsContext = DataViewEnumFilterArgsContext_[0]
/**
 * Provides information about the enum filter in current context.
 */
export const useDataViewEnumFilterArgs = DataViewEnumFilterArgsContext_[1]
