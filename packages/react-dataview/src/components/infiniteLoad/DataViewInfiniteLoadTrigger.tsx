import * as React from 'react'
import { forwardRef, ReactElement } from 'react'
import { useDataViewInfiniteLoadTrigger } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'

export const DataViewInfiniteLoadTrigger = forwardRef<HTMLElement, { children: ReactElement }>((props, ref) => {
	const triggerLoadMore = useDataViewInfiniteLoadTrigger()
	return (
		<Slot
			onClick={triggerLoadMore}
			ref={ref}
			{...{ disabled: triggerLoadMore === undefined }}
			{...props}
		/>
	)
})
