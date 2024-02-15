import * as React from 'react'
import { useId } from 'react'
import { FormErrorContext, FormFieldIdContext } from '../contexts'
import { SugaredRelativeSingleField, useField } from '@contember/react-binding'

const emptyArr: [] = []

export type FormFieldScopeProps = {
	field: SugaredRelativeSingleField['field']
	children: React.ReactNode
}

export const FormFieldScope = ({ field, children }: FormFieldScopeProps) => {
	const id = useId()
	const fieldAccessor = useField({ field })
	const errors = fieldAccessor.errors?.errors
	return (
		<FormFieldIdContext.Provider value={id}>
			<FormErrorContext.Provider value={errors ?? emptyArr}>
				{children}
			</FormErrorContext.Provider>
		</FormFieldIdContext.Provider>
	)
}
