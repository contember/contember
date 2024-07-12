import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFilter } from '../../../hooks'
import { DateRangeFilterArtifacts } from '../../../filterTypes'
import { useDataViewFilterName } from '../../../contexts'

export type DataViewDateFilterResetTriggerProps = {
	name?: string
	children: ReactElement
	type?: 'start' | 'end'
}

export const DataViewDateFilterResetTrigger = ({ name, type, ...props }: DataViewDateFilterResetTriggerProps) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const cb = useCallback(() => {
		setFilter(it => ({
			...it,
			start: !type || type === 'start' ? undefined : it?.start,
			end: !type || type === 'end' ? undefined : it?.end,
		}))
	}, [setFilter, type])
	const hasStart = state?.start !== undefined
	const hasEnd = state?.end !== undefined
	if (!hasStart && !hasEnd) {
		return null
	}
	if (type === 'start' && !hasStart || type === 'end' && !hasEnd) {
		return null
	}

	return <Slot onClick={cb} {...props} />
}
