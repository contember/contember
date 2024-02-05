import { useDataViewSelectionMethods } from '@contember/react-dataview'
import { LayoutSelectionKey } from '../internal/layout'
import { useCallback } from 'react'

export const useDataGridSetLayout = () => {
	const { setSelection } = useDataViewSelectionMethods()

	return useCallback((layout: 'default' | 'tiles') => {
		setSelection(LayoutSelectionKey, layout)
	}, [setSelection])
}
