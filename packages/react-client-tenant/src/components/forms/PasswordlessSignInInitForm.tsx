import { ReactElement, useCallback, useMemo } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types/forms'
import { useForm } from '../../contexts'
import { InitSignInPasswordlessMutationResult, useInitSignInPasswordlessMutation } from '../../hooks'
import { PASSWORDLESS_REQUEST_STORAGE_KEY } from '../../consts'

export type PasswordlessSignInInitFormValues = {
	email: string
}

export type PasswordlessSignInInitFormErrorCode =
	| TenantApi.InitSignInPasswordlessErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type PasswordlessSignInInitFormState = FormState

export type PasswordlessSignInInitFormError = FormError<PasswordlessSignInInitFormValues, PasswordlessSignInInitFormErrorCode>

export type PasswordlessSignInInitFormContextValue = FormContextValue<PasswordlessSignInInitFormValues, PasswordlessSignInInitFormErrorCode>


export interface PasswordlessSignInInitFormProps {
	children: ReactElement
	onSuccess?: (args: { result: InitSignInPasswordlessMutationResult }) => void
}

export const usePasswordlessSignInInitForm = useForm as () => PasswordlessSignInInitFormContextValue

export const PasswordlessSignInInitForm = ({ children, onSuccess }: PasswordlessSignInInitFormProps) => {

	const initSignIn = useInitSignInPasswordlessMutation()
	return (
		<TenantForm<PasswordlessSignInInitFormContextValue, InitSignInPasswordlessMutationResult>
			onSuccess={res => {
				localStorage.setItem(PASSWORDLESS_REQUEST_STORAGE_KEY, res.result.requestId)
				onSuccess?.(res)
			}}
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
				return await initSignIn({
					email: values.email,
				})
			}, [initSignIn])}
		>
			{children}
		</TenantForm>
	)

}
const errorToField: Record<TenantApi.InitSignInPasswordlessErrorCode, keyof PasswordlessSignInInitFormValues | undefined> = {
	PERSON_NOT_FOUND: 'email',
	PASSWORDLESS_DISABLED: undefined,
}
