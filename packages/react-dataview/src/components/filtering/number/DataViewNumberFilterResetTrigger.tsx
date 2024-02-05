import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFilter } from '../../../hooks'
import { NumberRangeFilterArtifacts } from '../../../filterTypes'

export type DataViewNumberFilterResetTriggerProps = {
	name: string
	children: ReactElement
}

export const DataViewNumberFilterResetTrigger = ({ name, ...props }: DataViewNumberFilterResetTriggerProps) => {
	const [state, setFilter] = useDataViewFilter<NumberRangeFilterArtifacts>(name)
	const cb = useCallback(() => {
		setFilter(it => ({
			...it,
			from: undefined,
			to: undefined,
		}))
	}, [setFilter])

	if (state?.from === undefined && state?.to === undefined) {
		return null
	}

	return <Slot onClick={cb} {...props} />
}
