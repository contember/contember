import * as React from 'react'
import { ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewFilter } from '../../../hooks'
import { TextFilterArtifacts } from '../../../filterTypes'

export type DataViewTextFilterResetTriggerProps = {
	name: string
	children: ReactElement
}

export const DataViewTextFilterResetTrigger = ({ name, ...props }: DataViewTextFilterResetTriggerProps) => {
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
