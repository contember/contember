import { forwardRef, MouseEvent, useCallback } from 'react'
import { useDataViewSortingMethods, useDataViewSortingState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { DataViewSortingDirection, DataViewSortingDirectionAction } from '../../types'

export interface DataViewSortingTriggerProps {
	action?: DataViewSortingDirectionAction
	field: string
	toggle?: boolean
	children: React.ReactNode
}

const actionToState: Record<Exclude<DataViewSortingDirectionAction, null>, DataViewSortingDirection> = {
	asc: 'asc',
	desc: 'desc',
	toggleAsc: 'asc',
	toggleDesc: 'desc',
	next: null,
	clear: null,
}

export const DataViewSortingTrigger = ({ action = 'next', field, ...props }: DataViewSortingTriggerProps) => {
	const { setOrderBy } = useDataViewSortingMethods()
	const orderDirections = useDataViewSortingState()

	const orderDirection = orderDirections.directions[field]
	const changeOrder = useCallback((e: MouseEvent) => {
		setOrderBy(field, action, e.ctrlKey || e.metaKey)
	}, [field, action, setOrderBy])

	const active = action && action !== 'next' && orderDirection === actionToState[action]

	return (
		<Slot
			onClick={changeOrder}
			data-active={dataAttribute(active)}
			data-current={orderDirection ?? 'none'}
			{...props}
		/>
	)
}
