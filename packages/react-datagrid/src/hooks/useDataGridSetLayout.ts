import { useDataViewSelectionMethods } from '@contember/react-dataview'

export const useDataGridSetLayout = () => {
	const { setLayout } = useDataViewSelectionMethods()
	return setLayout
}
