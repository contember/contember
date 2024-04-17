import { ReactElement, SetStateAction, useCallback } from 'react'
import { useDataViewSelectionMethods, useDataViewSelectionState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

export interface DataViewVisibilityTriggerProps {
	name: string
	value: SetStateAction<boolean | undefined>
	fallbackValue?: boolean
	children: ReactElement
}

export const DataViewVisibilityTrigger = ({ name, value, fallbackValue = true, ...props }: DataViewVisibilityTriggerProps) => {
	const { setVisibility } = useDataViewSelectionMethods()
	const state = useDataViewSelectionState()

	const handleClick = useCallback(() => {
		setVisibility(name, value)
	}, [name, setVisibility, value])
	const resolvedValue = state?.values?.visibility?.[name] ?? fallbackValue
	const isActive = resolvedValue === value
	return <Slot onClick={handleClick} data-active={dataAttribute(isActive)} data-current={dataAttribute(resolvedValue)} {...props} />
}
