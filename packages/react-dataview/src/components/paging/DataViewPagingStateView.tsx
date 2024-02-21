import { DataViewPagingInfo, DataViewPagingState } from '../../types'
import { ReactNode } from 'react'
import { useDataViewPagingInfo, useDataViewPagingState } from '../../contexts'

export interface DataViewPagingStateViewProps {
	render: (props: DataViewPagingState & DataViewPagingInfo) => ReactNode
}
export const DataViewPagingStateView = ({ render }: DataViewPagingStateViewProps) => {
	const state = useDataViewPagingState()
	const info = useDataViewPagingInfo()
	return render({ ...state, ...info })
}
