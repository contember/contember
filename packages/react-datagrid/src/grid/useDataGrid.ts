import { ControlledDataGridProps, DataGridProps } from './index'
import { useDataGridState } from '../internal/useDataGridState'

export const useDataGrid = <P extends {}>(props: DataGridProps<P>): ControlledDataGridProps => {
	return useDataGridState(props)
}
