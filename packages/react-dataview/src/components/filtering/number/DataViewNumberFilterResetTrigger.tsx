import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFilter } from '../../../hooks'
import { NumberRangeFilterArtifacts } from '../../../filterTypes'
import { useDataViewFilterName } from '../../../contexts'

export type DataViewNumberFilterResetTriggerProps = {
	name?: string
	children: ReactElement
}

export const DataViewNumberFilterResetTrigger = ({ name, ...props }: DataViewNumberFilterResetTriggerProps) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
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
