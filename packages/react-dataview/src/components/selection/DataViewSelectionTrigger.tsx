import { ReactElement, useCallback } from 'react'
import { DataViewSelectionValue } from '../../types'
import { useDataViewSelectionMethods, useDataViewSelectionState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { resolveValue } from './utils'

export interface DataViewSelectionTriggerProps {
	name: string
	value: DataViewSelectionValue | undefined | ((current: DataViewSelectionValue | undefined) => DataViewSelectionValue)
	fallback?: DataViewSelectionValue
	children: ReactElement
}

export const DataViewSelectionTrigger = ({ name, value, fallback, ...props }: DataViewSelectionTriggerProps) => {
	const { setSelection } = useDataViewSelectionMethods()
	const state = useDataViewSelectionState()

	const handleClick = useCallback(() => {
		setSelection(name, current => {
			return typeof value === 'function' ? value(current) : value
		})
	}, [name, setSelection, value])
	const resolvedValue = state ? resolveValue(state, { name, fallback }) : undefined
	const isActive = resolvedValue === value

	return <Slot onClick={handleClick} data-active={dataAttribute(isActive)} data-current={dataAttribute(resolvedValue)} {...props} />
}
