import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { useFormError, useFormFieldId } from '../contexts'
import { BindingError } from '@contember/react-binding'

export const FormLabel = (props: {
	children: React.ReactElement
}) => {
	const id = useFormFieldId()
	const errors = useFormError()
	if (errors === undefined || id === undefined) {
		throw new BindingError('FormLabel must be used inside a FormField')
	}
	return (
		<Slot
			data-invalid={dataAttribute(errors.length > 0)}
			{...{ htmlFor: `${id}-input` }}
			{...props}
		/>
	)
}
