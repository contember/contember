import { createRequiredContext } from '@contember/react-utils'
import { DataGridColumns } from '../types'

const DataGridColumnsContextTmp = createRequiredContext<DataGridColumns<{}>>('DataGridColumnsContext')
export const DataGridColumnsContext = DataGridColumnsContextTmp[0]
export const useDataGridColumns = DataGridColumnsContextTmp[1] as <T extends {}>() => DataGridColumns<T>
