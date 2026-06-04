import { ReactElement } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { VerifyEmailErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { useVerifyEmailMutation } from '../../hooks/index.js'

export type VerifyEmailFormValues = {
	token: string
}

export type VerifyEmailFormErrorCode =
	| VerifyEmailErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type VerifyEmailFormState = FormState

export type VerifyEmailFormError = FormError<VerifyEmailFormValues, VerifyEmailFormErrorCode>

export type VerifyEmailFormContextValue = FormContextValue<VerifyEmailFormValues, VerifyEmailFormErrorCode>

export interface VerifyEmailFormProps {
	children: ReactElement
	onSuccess?: () => void
	token?: string
}

export const useVerifyEmailForm = useForm as () => VerifyEmailFormContextValue

export const VerifyEmailForm = ({ children, onSuccess, token }: VerifyEmailFormProps) => {
	const verifyEmail = useVerifyEmailMutation()
	return (
		<TenantForm<VerifyEmailFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={{
				token: token ?? '',
			}}
			validate={({ values }) => {
				const errors: VerifyEmailFormError[] = []
				if (!values.token) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'token' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await verifyEmail({
					token: values.token,
				})
			}}
		>
			{children}
		</TenantForm>
	)
}
const errorToField: Record<TenantApi.VerifyEmailErrorCode, keyof VerifyEmailFormValues | undefined> = {
	TOKEN_EXPIRED: 'token',
	TOKEN_NOT_FOUND: 'token',
	TOKEN_USED: 'token',
	TOKEN_INVALID: 'token',
}
