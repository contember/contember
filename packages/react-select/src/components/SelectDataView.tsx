import React, { ReactNode, useMemo } from 'react'
import { useSelectHandleSelect, useSelectOptions, useSelectOptionsFilter } from '../contexts'
import { DataViewProps, DataView, DataViewFilterHandlerRegistry } from '@contember/react-dataview'

export type SelectDataViewProps =
	& Omit<DataViewProps, 'entities'>
	& {
		children: ReactNode
	}

export const SelectDataView = (props: SelectDataViewProps) => {
	const handleSelect = useSelectHandleSelect()
	const entities = useSelectOptions()
	const filter = useSelectOptionsFilter()
	const defaultFilterTypes = useMemo((): DataViewFilterHandlerRegistry => filter ? { query: filter } : {}, [filter])

	return (
		<DataView filterTypes={defaultFilterTypes} {...props} onSelectHighlighted={handleSelect} entities={entities} />
	)
}
