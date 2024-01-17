import { DataViewPagingState } from '../types'
import { ReactNode } from 'react'
import { useDataViewPagingState } from '../internal/contexts'

export interface DataViewPagingStateViewProps {
	render: (props: DataViewPagingState) => ReactNode
}
export const DataViewPagingStateView = ({ render }: DataViewPagingStateViewProps) => {
	const state = useDataViewPagingState()
	return render(state)
}
