import { ReactElement, useCallback } from 'react'
import { useDataViewSelectionMethods, useDataViewSelectionState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

export interface DataViewLayoutTriggerProps {
	name: string | undefined
	children: ReactElement
}

export const DataViewLayoutTrigger = ({ name, ...props }: DataViewLayoutTriggerProps) => {
	const { setLayout } = useDataViewSelectionMethods()
	const layoutCurrent = useDataViewSelectionState()?.values?.layout

	const handleClick = useCallback(() => {
		setLayout(name)
	}, [setLayout, name])
	const isActive = name === layoutCurrent

	return <Slot onClick={handleClick} data-active={dataAttribute(isActive)} data-current={dataAttribute(layoutCurrent)} {...props} />
}
