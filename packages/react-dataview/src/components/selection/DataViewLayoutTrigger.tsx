import { ReactElement, useCallback } from 'react'
import { useDataViewSelectionMethods, useDataViewSelectionState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

export interface DataViewLayoutTriggerProps {
	layout: string | undefined
	children: ReactElement
}

export const DataViewLayoutTrigger = ({ layout, ...props }: DataViewLayoutTriggerProps) => {
	const { setLayout } = useDataViewSelectionMethods()
	const layoutCurrent = useDataViewSelectionState()?.layout

	const handleClick = useCallback(() => {
		setLayout(layout)
	}, [setLayout, layout])
	const isActive = layout === layoutCurrent

	return <Slot onClick={handleClick} data-active={dataAttribute(isActive)} data-current={dataAttribute(layout)} {...props} />
}
