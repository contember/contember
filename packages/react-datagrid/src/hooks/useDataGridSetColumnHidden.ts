import { useDataViewSelectionMethods } from '@contember/react-dataview'
import { useCallback } from 'react'
import { getHidingKey } from '../internal/hiding'

export const useDataGridSetColumnHidden = () => {
	const { setSelection } = useDataViewSelectionMethods()

	return useCallback((column: string, hidden: boolean) => {
		setSelection(getHidingKey(column), hidden)
	}, [setSelection])
}
