import { ReactElement, useCallback, useMemo } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { RequestEmailVerificationErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/forms.js'
import { useForm } from '../../contexts.js'
import { useRequestEmailVerificationMutation } from '../../hooks/index.js'

export type RequestEmailVerificationFormValues = {
	email: string
}

export type RequestEmailVerificationFormErrorCode =
	| RequestEmailVerificationErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type RequestEmailVerificationFormState = FormState

export type RequestEmailVerificationFormError = FormError<RequestEmailVerificationFormValues, RequestEmailVerificationFormErrorCode>

export type RequestEmailVerificationFormContextValue = FormContextValue<RequestEmailVerificationFormValues, RequestEmailVerificationFormErrorCode>

export interface RequestEmailVerificationFormProps {
	children: ReactElement
	onSuccess?: () => void
}

export const useRequestEmailVerificationForm = useForm as () => RequestEmailVerificationFormContextValue

export const RequestEmailVerificationForm = ({ children, onSuccess }: RequestEmailVerificationFormProps) => {
	const requestEmailVerification = useRequestEmailVerificationMutation()
	return (
		<TenantForm<RequestEmailVerificationFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={useMemo(() => ({
				email: '',
			}), [])}
			validate={({ values }) => {
				if (!values.email) {
					return [{ code: 'FIELD_REQUIRED', field: 'email' }]
				} else if (!values.email.match(/^.+@.+$/)) {
					return [{ code: 'INVALID_VALUE', field: 'email' }]
				}
				return []
			}}
			execute={useCallback(async ({ values }) => {
				return await requestEmailVerification({
					email: values.email,
				})
			}, [requestEmailVerification])}
		>
			{children}
		</TenantForm>
	)
}
const errorToField: Record<TenantApi.RequestEmailVerificationErrorCode, keyof RequestEmailVerificationFormValues | undefined> = {
	RATE_LIMIT_EXCEEDED: undefined,
}
