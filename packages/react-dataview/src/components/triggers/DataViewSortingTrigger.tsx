import { forwardRef, MouseEvent, useCallback } from 'react'
import { useDataViewSortingMethods, useDataViewSortingState } from '../../internal/contexts'
import { Slot } from '@radix-ui/react-slot'

export interface DataViewSortingTriggerProps {
	direction?: 'asc' | 'desc'
	field: string
	children: React.ReactNode
}

export const DataViewSortingTrigger = forwardRef<HTMLElement, DataViewSortingTriggerProps>(({ direction, field, ...props }: DataViewSortingTriggerProps, ref) => {
	const { setOrderBy } = useDataViewSortingMethods()
	const orderDirections = useDataViewSortingState()

	const orderDirection = orderDirections.directions[field]
	const changeOrder = useCallback((e: MouseEvent) => {
		setOrderBy(field, direction ?? 'next', e.ctrlKey || e.metaKey)
	}, [field, direction, setOrderBy])

	const disabled = direction !== undefined && orderDirection === direction
	return (
		<Slot
			onClick={changeOrder}
			ref={ref}
			{...{ disabled: disabled ? '1' : undefined }}
			{...props}
		/>
	)
})
