import * as React from 'react'
import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useEntity } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'
import { DataViewRelationFilterCurrent, DataViewSetRelationFilterAction, useDataViewRelationFilter } from '../../../hooks'


const actionToState: Record<DataViewSetRelationFilterAction, DataViewRelationFilterCurrent> = {
	exclude: 'exclude',
	include: 'include',
	unset: 'none',
	toggleInclude: 'include',
	toggleExclude: 'exclude',
}

export const DataViewRelationFilterTrigger = ({ name, action = 'include', ...props }: {
	name: string
	children: ReactNode
	action?: DataViewSetRelationFilterAction
}) => {
	const entity = useEntity()
	const [current, setFilter] = useDataViewRelationFilter(name, entity.id)
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
