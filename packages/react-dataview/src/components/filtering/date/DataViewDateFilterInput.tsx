import * as React from 'react'
import { ComponentType, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewDateFilterInput } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

const SlotInput = Slot as ComponentType<React.InputHTMLAttributes<HTMLInputElement>>

export const DataViewDateFilterInput = ({ name, type, ...props }: {
	name?: string
	type: 'start' | 'end'
	children: ReactElement
}) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	return <SlotInput {...useDataViewDateFilterInput({ name, type })} {...props} />
}
