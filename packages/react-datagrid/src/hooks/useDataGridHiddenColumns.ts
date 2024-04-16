import { useDataViewSelectionState } from '@contember/react-dataview'
import { useMemo } from 'react'

export const useDataGridHiddenColumns = () => {
	const selection = useDataViewSelectionState()

	return useMemo(() => {
		return Object.fromEntries(
			Object.entries(selection?.visibility ?? {})
				.filter(([key, value]) => value === false)
				.map(([key, value]) => [key, value]),
		)
	}, [selection?.visibility])
}
