import * as React from 'react'
import { SugaredRelativeSingleField, useField } from '@contember/react-binding'
import { FormFieldStateProvider } from './FormFieldStateProvider'

export type FormFieldScopeProps = {
	field: SugaredRelativeSingleField['field']
	children: React.ReactNode
	required?: boolean
}

export const FormFieldScope = ({ field, children, required }: FormFieldScopeProps) => {
	const fieldAccessor = useField({ field })
	return (
		<FormFieldStateProvider
			errors={fieldAccessor.errors?.errors}
			required={required ?? !fieldAccessor.schema.nullable}
			dirty={fieldAccessor.hasUnpersistedChanges}
		>
			{children}
		</FormFieldStateProvider>
	)
}
