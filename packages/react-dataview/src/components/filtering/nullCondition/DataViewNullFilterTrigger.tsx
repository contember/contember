import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { DataViewNullFilterState, DataViewSetNullFilterAction, useDataViewNullFilter } from '../../../hooks'


const actionToState: Record<DataViewSetNullFilterAction, DataViewNullFilterState> = {
	exclude: 'exclude',
	include: 'include',
	unset: 'none',
	toggleInclude: 'include',
	toggleExclude: 'exclude',
}

export const DataViewNullFilterTrigger = ({ name, action, ...props }: {
	name: string
	children: ReactNode
	action: DataViewSetNullFilterAction
}) => {
	const [current, setFilter] = useDataViewNullFilter(name)
	const toggleFilter = useCallback(() => {
		setFilter(action)
	}, [action, setFilter])

	return (
		<Slot
			onClick={toggleFilter}
			data-active={dataAttribute(current === actionToState[action])}
			data-current={current}
			{...props}
		/>
	)
}
