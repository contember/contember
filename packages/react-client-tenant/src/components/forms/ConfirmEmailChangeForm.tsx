import { ReactElement } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { ConfirmEmailChangeErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { useConfirmEmailChangeMutation } from '../../hooks'

export type ConfirmEmailChangeFormValues = {
	token: string
}

export type ConfirmEmailChangeFormErrorCode =
	| ConfirmEmailChangeErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type ConfirmEmailChangeFormState = FormState

export type ConfirmEmailChangeFormError = FormError<ConfirmEmailChangeFormValues, ConfirmEmailChangeFormErrorCode>

export type ConfirmEmailChangeFormContextValue = FormContextValue<ConfirmEmailChangeFormValues, ConfirmEmailChangeFormErrorCode>

export interface ConfirmEmailChangeFormProps {
	children: ReactElement
	onSuccess?: () => void
	token?: string
}

export const useConfirmEmailChangeForm = useForm as () => ConfirmEmailChangeFormContextValue

export const ConfirmEmailChangeForm = ({ children, onSuccess, token }: ConfirmEmailChangeFormProps) => {
	const confirmEmailChange = useConfirmEmailChangeMutation()
	return (
		<TenantForm<ConfirmEmailChangeFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={{
				token: token ?? '',
			}}
			validate={({ values }) => {
				const errors: ConfirmEmailChangeFormError[] = []
				if (!values.token) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'token' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await confirmEmailChange({
					token: values.token,
				})
			}}
		>
			{children}
		</TenantForm>
	)
}
const errorToField: Record<TenantApi.ConfirmEmailChangeErrorCode, keyof ConfirmEmailChangeFormValues | undefined> = {
	TOKEN_EXPIRED: 'token',
	TOKEN_NOT_FOUND: 'token',
	TOKEN_USED: 'token',
	TOKEN_INVALID: 'token',
	EMAIL_ALREADY_EXISTS: undefined,
	INVALID_EMAIL_FORMAT: undefined,
}
