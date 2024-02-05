import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { DataViewEnumFilterCurrent, DataViewSetEnumFilterAction, useDataViewEnumFilter } from '../../../hooks'


const actionToState: Record<DataViewSetEnumFilterAction, DataViewEnumFilterCurrent> = {
	exclude: 'exclude',
	include: 'include',
	unset: 'none',
	toggleInclude: 'include',
	toggleExclude: 'exclude',
}

export const DataViewEnumFilterTrigger = ({ name, action = 'include', value, ...props }: {
	name: string
	value: string
	children: ReactNode
	action?: DataViewSetEnumFilterAction
}) => {
	const [current, setFilter] = useDataViewEnumFilter(name, value)
	const toggleFilter = useCallback(() => {
		setFilter(action)
	}, [action, setFilter])

	return (
		<Slot
			onClick={toggleFilter}
			data-active={dataAttribute(current === actionToState[action])}
			data-current={dataAttribute(current)}
			{...props}
		/>
	)
}
