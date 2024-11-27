import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { useFormFieldState } from '../contexts'
import { BindingError } from '@contember/react-binding'

export const FormLabel = (props: {
	children: React.ReactElement
}) => {
	const formState = useFormFieldState()
	if (!formState) {
		throw new BindingError('FormError must be used inside a FormField')
	}
	const { errors, id, dirty, required } = formState
	return (
		<Slot
			data-invalid={dataAttribute(errors.length > 0)}
			data-dirty={dataAttribute(dirty)}
			data-required={dataAttribute(required)}
			{...{ htmlFor: `${id}-input` }}
			{...props}
		/>
	)
}
