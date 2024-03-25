import * as React from 'react'
import { ComponentType, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewTextFilterInput } from '../../../hooks'

const SlotInput = Slot as ComponentType<React.InputHTMLAttributes<HTMLInputElement>>

export const DataViewTextFilterInput = ({ name, debounceMs, ...props }: {
	name: string
	debounceMs?: number
	children: ReactElement
}) => {
	return <SlotInput {...useDataViewTextFilterInput({ name, debounceMs })} {...props} />
}
