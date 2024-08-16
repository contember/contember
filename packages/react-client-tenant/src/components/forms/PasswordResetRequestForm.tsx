import { ReactElement, useCallback, useMemo } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { CreatePasswordResetRequestErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types/forms'
import { useForm } from '../../contexts'
import { useCreateResetPasswordRequestMutation } from '../../hooks'

export type PasswordResetRequestFormValues = {
	email: string
}

export type PasswordResetRequestFormErrorCode =
	| CreatePasswordResetRequestErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type PasswordResetRequestFormState = FormState

export type PasswordResetRequestFormError = FormError<PasswordResetRequestFormValues, PasswordResetRequestFormErrorCode>

export type PasswordResetRequestFormContextValue = FormContextValue<PasswordResetRequestFormValues, PasswordResetRequestFormErrorCode>


export interface PasswordResetRequestFormProps {
	children: ReactElement
	onSuccess?: () => void
}

export const usePasswordResetRequestForm = useForm as () => PasswordResetRequestFormContextValue

export const PasswordResetRequestForm = ({ children, onSuccess }: PasswordResetRequestFormProps) => {

	const createResetRequest = useCreateResetPasswordRequestMutation()
	return (
		<TenantForm<PasswordResetRequestFormContextValue>
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
				return await createResetRequest({
					email: values.email,
				})
			}, [createResetRequest])}
		>
			{children}
		</TenantForm>
	)

}
const errorToField: Record<TenantApi.CreatePasswordResetRequestErrorCode, keyof PasswordResetRequestFormValues | undefined> = {
	PERSON_NOT_FOUND: 'email',
}
