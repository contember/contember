import * as React from 'react'
import { ComponentType, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewDateFilterInput } from '../../../hooks'

const SlotInput = Slot as ComponentType<React.InputHTMLAttributes<HTMLInputElement>>

export const DataViewDateFilterInput = ({ name, type, ...props }: {
	name: string
	type: 'start' | 'end'
	children: ReactElement
}) => {
	return <SlotInput {...useDataViewDateFilterInput({ name, type })} {...props} />
}
