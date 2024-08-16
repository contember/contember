import { ReactNode } from 'react'
import { useDataViewSortingState } from '../../contexts'

export interface DataViewSortingSwitchProps {
	field: string
	asc?: ReactNode
	desc?: ReactNode
	none?: ReactNode
}
export const DataViewSortingSwitch = ({ field, ...props }: DataViewSortingSwitchProps) => {
	const orderState = useDataViewSortingState().directions[field] ?? 'none'
	return props[orderState] ?? null
}
