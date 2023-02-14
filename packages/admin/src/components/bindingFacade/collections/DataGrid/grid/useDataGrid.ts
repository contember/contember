import { ControlledDataGridProps, DataGridProps } from './index'
import { useDataGridState } from '../internal/useDataGridState'

export const useDataGrid = <P extends {}>(props: DataGridProps<P>): ControlledDataGridProps<P> => {
	const [state, stateMethods] = useDataGridState(props)
	return { ...props, state, stateMethods }
}
