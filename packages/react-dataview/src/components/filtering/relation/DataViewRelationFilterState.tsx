import * as React from 'react'
import { isValidElement, ReactNode } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { DataViewRelationFilterCurrent, useDataViewRelationFilter } from '../../../hooks'
import { useEntity } from '@contember/react-binding'
import { useDataViewFilterName } from '../../../contexts'

/**
 * Conditionally renders its children based on the current relation filter state.
 * If children is a valid React element, it will be wrapped in a Slot component with the current state as a `data-current` attribute.
 */
export const DataViewRelationFilterState = ({ name, children, state }: {
	name?: string
	children: ReactNode
	state?: DataViewRelationFilterCurrent | DataViewRelationFilterCurrent[]
}) => {
	const entity = useEntity()
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [current] = useDataViewRelationFilter(name, entity.id)

	if (!state || state === current || (Array.isArray(state) && state.includes(current))) {
		if (isValidElement(children)) {
			return <Slot data-current={current}>{children}</Slot>
		}
		return <>{children}</>
	}
	return null
}
