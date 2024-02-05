import { useDataViewSortingState } from '../../contexts'
import { OrderBy, QueryLanguage, useEnvironment } from '@contember/react-binding'
import { useMemo } from 'react'

export const useDataViewResolvedSorting = () => {
	const state = useDataViewSortingState()

}
