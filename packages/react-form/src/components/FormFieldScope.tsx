import * as React from 'react'
import { useMemo } from 'react'
import { SugaredRelativeSingleField, useField } from '@contember/react-binding'
import { FormFieldStateProvider } from './FormFieldStateProvider'

export type FormFieldScopeProps = {
	field: SugaredRelativeSingleField['field']
	children: React.ReactNode
	required?: boolean
}

export const FormFieldScope = ({ field, children, required }: FormFieldScopeProps) => {
	const fieldAccessor = useField({ field })
	const entityName = fieldAccessor.getParent().name
	const fieldName = fieldAccessor.fieldName
	const enumName = fieldAccessor.schema.enumName ?? undefined
	const fieldInfo = useMemo(() => ({ entityName, fieldName, enumName }), [entityName, fieldName, enumName])

	return (
		<FormFieldStateProvider
			errors={fieldAccessor.errors?.errors}
			required={required ?? !fieldAccessor.schema.nullable}
			dirty={fieldAccessor.hasUnpersistedChanges}
			field={fieldInfo}
		>
			{children}
		</FormFieldStateProvider>
	)
}
