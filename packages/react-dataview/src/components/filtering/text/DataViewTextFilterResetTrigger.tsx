import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFilter } from '../../../hooks'
import { TextFilterArtifacts } from '../../../filterTypes'
import { useDataViewFilterName } from '../../../contexts'

export type DataViewTextFilterResetTriggerProps = {
	name?: string
	children: ReactElement
}

export const DataViewTextFilterResetTrigger = ({ name, ...props }: DataViewTextFilterResetTriggerProps) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	const [state, setFilter] = useDataViewFilter<TextFilterArtifacts>(name)
	const cb = useCallback(() => {
		setFilter(it => ({
			...it,
			query: '',
		}))
	}, [setFilter])

	if (!state?.query) {
		return null
	}

	return <Slot onClick={cb} {...props} />
}
