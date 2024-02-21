import { useDataViewSelectionState } from '@contember/react-dataview'
import { LayoutSelectionKey } from '../internal/layout'

export const useDataGridLayout = () => {
	return useDataViewSelectionState()?.values[LayoutSelectionKey] ?? 'default' as 'default' | 'tiles'
}
