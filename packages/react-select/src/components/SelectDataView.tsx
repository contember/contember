import React, { ReactNode } from 'react'
import { useSelectHandleSelect, useSelectOptions } from '../contexts'
import { DataViewProps, DataView } from '@contember/react-dataview'

export type SelectDataViewProps =
	& Omit<DataViewProps, 'entities'>
	& {
		children: ReactNode
	}

export const SelectDataView = (props: SelectDataViewProps) => {
	const handleSelect = useSelectHandleSelect()
	const entities = useSelectOptions()
	return (
		<DataView {...props} onSelectHighlighted={handleSelect} entities={entities} />
	)
}
