import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFilter } from '../../../hooks'
import { DateRangeFilterArtifacts } from '../../../filterTypes'

export type DataViewDateFilterResetTriggerProps = {
	name: string
	children: ReactElement
}

export const DataViewDateFilterResetTrigger = ({ name, ...props }: DataViewDateFilterResetTriggerProps) => {
	const [state, setFilter] = useDataViewFilter<DateRangeFilterArtifacts>(name)
	const cb = useCallback(() => {
		setFilter(it => ({
			...it,
			start: undefined,
			end: undefined,
		}))
	}, [setFilter])

	if (state?.start === undefined && state?.end === undefined) {
		return null
	}

	return <Slot onClick={cb} {...props} />
}
