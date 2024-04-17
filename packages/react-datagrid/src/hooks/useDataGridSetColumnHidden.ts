import { useDataViewSelectionMethods } from '@contember/react-dataview'
import { useCallback } from 'react'

export const useDataGridSetColumnHidden = () => {
	const { setVisibility } = useDataViewSelectionMethods()

	return useCallback((column: string, hidden: boolean) => {
		setVisibility(column, !hidden)
	}, [setVisibility])
}
