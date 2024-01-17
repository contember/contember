import { useDataViewSortingState } from '../hooks'
import { ReactNode } from 'react'

export interface DataViewSortingConditionProps {
	field: string
	direction: 'asc' | 'desc' | 'none'
	children: ReactNode
}
export const DataViewSortingCondition = ({ field, direction, children }: DataViewSortingConditionProps) => {
	const orderState = useDataViewSortingState().directions[field] ?? 'none'
	return orderState === direction ? children : null
}
