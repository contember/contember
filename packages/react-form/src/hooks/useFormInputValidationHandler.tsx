import * as React from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { FieldAccessor } from '@contember/binding'
import { useEntityBeforePersist } from '@contember/react-binding'

export const useFormInputValidationHandler = (field: FieldAccessor<any>) => {
	const accessorGetter = field.getAccessor
	const validationMessage = useRef<string>()
	const [focus, setFocus] = React.useState(false)
	const inputRef = React.useRef<HTMLInputElement>(null)
	useEntityBeforePersist(useCallback(() => {
		if (validationMessage.current) {
			accessorGetter().addError(validationMessage.current)
		}
	}, [accessorGetter]))

	useEffect(() => {
		if (!inputRef.current) {
			return
		}
		const input = inputRef.current
		const valid = input.validity?.valid
		const message = valid ? undefined : input?.validationMessage
		if (message !== validationMessage.current) {
			validationMessage.current = message
			if (!message || !focus) {
				accessorGetter().clearErrors()
			}
			if (!focus && message) {
				accessorGetter().addError(message)
			}
		}
	})

	return {
		ref: inputRef,
		onFocus: useCallback(() => {
			setFocus(true)
		}, []),
		onBlur: useCallback(() => {
			setFocus(false)
			accessorGetter().clearErrors()
			if (validationMessage.current) {
				accessorGetter().addError(validationMessage.current)
			}
		}, [accessorGetter]),
	}
}
