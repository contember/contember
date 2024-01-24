import { createRequiredContext } from '@contember/react-utils'
import { DataGridColumns, DataGridHidingMethods, DataGridHidingState, DataGridLayoutMethods, DataGridLayoutState } from '../types'

const DataGridColumnsContextTmp = createRequiredContext<DataGridColumns<{}>>('DataGridColumnsContext')
export const DataGridColumnsContext = DataGridColumnsContextTmp[0]
export const useDataGridColumns = DataGridColumnsContextTmp[1] as <T extends {}>() => DataGridColumns<T>

export const [DataGridHidingStateContext, useDataGridHidingState] = createRequiredContext<DataGridHidingState>('DataGridHidingStateContext')
export const [DataGridHidingMethodsContext, useDataGridHidingMethods] = createRequiredContext<DataGridHidingMethods>('DataGridHidingMethodsContext')

export const [DataGridLayoutStateContext, useDataGridLayoutState] = createRequiredContext<DataGridLayoutState>('DataGridLayoutStateContext')
export const [DataGridLayoutMethodsContext, useDataGridLayoutMethods] = createRequiredContext<DataGridLayoutMethods>('DataGridLayoutMethodsContext')
