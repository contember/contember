import { useDataViewSelectionState } from '@contember/react-dataview'

export const useDataGridLayout = () => {
	return useDataViewSelectionState()?.values?.layout ?? 'default' as 'default' | 'tiles'
}
