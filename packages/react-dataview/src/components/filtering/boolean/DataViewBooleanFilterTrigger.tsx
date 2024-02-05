import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { DataViewBooleanFilterCurrent, DataViewSetBooleanFilterAction, useDataViewBooleanFilter } from '../../../hooks'


const actionToState: Record<DataViewSetBooleanFilterAction, DataViewBooleanFilterCurrent> = {
	include: 'include',
	unset: 'none',
	toggle: 'include',
}

export const DataViewBooleanFilterTrigger = ({ name, action = 'include', value, ...props }: {
	name: string
	value: boolean
	children: ReactNode
	action?: DataViewSetBooleanFilterAction
}) => {
	const [current, setFilter] = useDataViewBooleanFilter(name, value)
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
