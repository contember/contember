import { forwardRef, ReactNode, useCallback } from 'react'
import { useDataViewPagingMethods, useDataViewPagingState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'


export interface DataViewSetItemsPerPageTriggerProps {
	children: ReactNode
	value: number
}

export const DataViewSetItemsPerPageTrigger = forwardRef<HTMLElement, DataViewSetItemsPerPageTriggerProps>(({ value, ...props }, ref) => {
	const { setItemsPerPage } = useDataViewPagingMethods()
	const { itemsPerPage: current } = useDataViewPagingState()

	const setItems = useCallback(() => {
		setItemsPerPage(value)
	}, [setItemsPerPage, value])

	return (
		<Slot
			ref={ref}
			onClick={setItems}
			data-active={value === current ? '1' : undefined}
			{...props}
		/>
	)
})
