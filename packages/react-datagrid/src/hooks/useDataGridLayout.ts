import { useDataViewSelectionState } from '@contember/react-dataview'

export const useDataGridLayout = () => {
	return useDataViewSelectionState()?.layout ?? 'default' as 'default' | 'tiles'
}
