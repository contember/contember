import { useDataViewSelectionState } from '@contember/react-dataview'
import { useMemo } from 'react'
import { HiddenColumnPrefix } from '../internal/hiding'

export const useDataGridHiddenColumns = () => {
	const selection = useDataViewSelectionState()

	return useMemo(() => {
		return Object.fromEntries(
			Object.entries(selection?.values ?? {})
				.filter(([key, value]) => key.startsWith(HiddenColumnPrefix) && value === true)
				.map(([key, value]) => [key.slice(HiddenColumnPrefix.length), value]),
		)
	}, [selection?.values])
}
