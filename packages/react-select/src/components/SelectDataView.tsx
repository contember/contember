import React, { ReactNode, useMemo } from 'react'
import { useSelectHandleSelect, useSelectOptions } from '../contexts'
import { DataViewProps, DataView, DataViewFilterHandlerRegistry } from '@contember/react-dataview'

export type SelectDataViewProps =
	& Omit<DataViewProps, 'entities'>
	& {
		children: ReactNode
	}

export const SelectDataView = (props: SelectDataViewProps) => {
	const handleSelect = useSelectHandleSelect()
	const entities = useSelectOptions()

	return (
		<DataView
			onSelectHighlighted={handleSelect}
			entities={entities}
			filteringStateStorage="null"
			sortingStateStorage="null"
			currentPageStateStorage="null"
			{...props}
		/>
	)
}
