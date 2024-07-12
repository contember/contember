import * as React from 'react'
import { ComponentType, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewNumberFilterInput } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

const SlotInput = Slot as ComponentType<React.InputHTMLAttributes<HTMLInputElement>>

export const DataViewNumberFilterInput = ({ name, type, allowFloat, ...props }: {
	name?: string
	type: 'from' | 'to'
	allowFloat?: boolean
	children: ReactElement
}) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	name ??= useDataViewFilterName()
	return <SlotInput {...useDataViewNumberFilterInput({ name, type, allowFloat })} {...props} />
}
