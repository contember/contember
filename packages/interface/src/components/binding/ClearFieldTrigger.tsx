import { ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Component, Field, SugaredRelativeSingleField, useField } from '@contember/react-binding'

export interface ClearFieldTriggerProps {
	field: SugaredRelativeSingleField['field']
	children: ReactNode
}

export const ClearFieldTrigger = Component<ClearFieldTriggerProps>(({ field, ...props }) => {
	const fieldAccessor = useField(field)
	const clearField = useCallback(() => {
		fieldAccessor.updateValue(null)
	}, [fieldAccessor])
	return <Slot onClick={clearField} {...props} />
}, ({ field }) => {
	return <Field field={field} />
})
