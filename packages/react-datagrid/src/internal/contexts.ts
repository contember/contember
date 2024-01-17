import { createNonNullableContextFactory } from '@contember/react-utils'
import { DataGridColumns, DataGridHidingMethods, DataGridHidingState, DataGridLayoutMethods, DataGridLayoutState } from '../types'

const DataGridColumnsContextTmp = createNonNullableContextFactory<DataGridColumns<{}>>('DataGridColumnsContext')
export const DataGridColumnsContext = DataGridColumnsContextTmp[0]
export const useDataGridColumns = DataGridColumnsContextTmp[1] as <T extends {}>() => DataGridColumns<T>

export const [DataGridHidingStateContext, useDataGridHidingState] = createNonNullableContextFactory<DataGridHidingState>('DataGridHidingStateContext')
export const [DataGridHidingMethodsContext, useDataGridHidingMethods] = createNonNullableContextFactory<DataGridHidingMethods>('DataGridHidingMethodsContext')

export const [DataGridLayoutStateContext, useDataGridLayoutState] = createNonNullableContextFactory<DataGridLayoutState>('DataGridLayoutStateContext')
export const [DataGridLayoutMethodsContext, useDataGridLayoutMethods] = createNonNullableContextFactory<DataGridLayoutMethods>('DataGridLayoutMethodsContext')
