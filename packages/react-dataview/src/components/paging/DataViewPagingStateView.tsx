import { DataViewPagingInfo, DataViewPagingState } from '../../types'
import { ReactNode } from 'react'
import { useDataViewPagingInfo, useDataViewPagingState } from '../../contexts'

export interface DataViewPagingStateViewProps {
	/**
	 * The render function. Receives the current paging state and info.
	 */
	render: (props: DataViewPagingState & DataViewPagingInfo) => ReactNode
}

/**
 * A component that invokes a render function with the current paging state and info.
 */
export const DataViewPagingStateView = ({ render }: DataViewPagingStateViewProps) => {
	const state = useDataViewPagingState()
	const info = useDataViewPagingInfo()
	return <>{render({ ...state, ...info })}</>
}
