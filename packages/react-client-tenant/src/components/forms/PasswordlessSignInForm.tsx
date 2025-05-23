import * as TenantApi from '@contember/graphql-client-tenant'
import { useSetSessionToken } from '@contember/react-client'
import { ReactElement, useCallback, useMemo } from 'react'
import { useForm } from '../../contexts'
import { SignInPasswordlessMutationResult, useSignInPasswordlessMutation } from '../../hooks'
import { useRedirectToBacklinkCallback } from '../../internal/hooks/useRedirectToBacklink'
import { FormContextValue, FormError, FormState } from '../../types/forms'
import { TenantForm } from './TenantForm'

export type PasswordlessSignInFormValues = {
	token: string
	otpToken: string
}

export type PasswordlessSignInFormErrorCode =
	| TenantApi.SignInPasswordlessErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type PasswordlessSignInFormState =
	| FormState
	| 'otp-required'

export type PasswordlessSignInFormError = FormError<PasswordlessSignInFormValues, PasswordlessSignInFormErrorCode>

export type PasswordlessSignInFormContextValue = FormContextValue<PasswordlessSignInFormValues, PasswordlessSignInFormErrorCode, PasswordlessSignInFormState>


export interface PasswordlessSignInFormProps {
	requestId: string
	validationType: TenantApi.PasswordlessValidationType
	token?: string
	expiration?: number
	children: ReactElement
	onSuccess?: () => void
}

export const usePasswordlessSignInForm = useForm as () => PasswordlessSignInFormContextValue

const headers = {
	'X-Contember-Token-Path': 'data.mutation.result.token',
}
const DEFAULT_LOGIN_EXPIRATION = 14 * 24 * 60 // 14 days

export const PasswordlessSignInForm = ({ children, onSuccess, requestId, validationType, token, expiration = DEFAULT_LOGIN_EXPIRATION }: PasswordlessSignInFormProps) => {

	const signIn = useSignInPasswordlessMutation({ headers })
	const redirectToBacklink = useRedirectToBacklinkCallback()
	const setSessionToken = useSetSessionToken()
	return (
		<TenantForm<PasswordlessSignInFormContextValue, SignInPasswordlessMutationResult>
			onSuccess={args => {
				onSuccess?.()
				setSessionToken(args.result.token)
				redirectToBacklink()
			}}
			errorMapping={errorToField}
			initialValues={useMemo(() => ({
				token: token ?? '',
				otpToken: '',
			}), [token])}
			validate={({ values, state }) => {
				if (!values.token) {
					return [{ code: 'FIELD_REQUIRED', field: 'token' }]
				}
				if (!values.otpToken && state === 'otp-required') {
					return [{ code: 'FIELD_REQUIRED', field: 'otpToken' }]
				} else if (values.otpToken && !values.otpToken.match(/^\d{6}$/)) {
					return [{ code: 'INVALID_VALUE', field: 'otpToken' }]
				}
				return []
			}}
			execute={useCallback(async ({ values }) => {
				const result = await signIn({
					requestId,
					expiration,
					token: values.token,
					mfaOtp: values.otpToken || undefined,
					validationType,
				})
				if (!result.ok && result.error === 'OTP_REQUIRED') {
					return { ...result, state: 'otp-required' }
				}

				return result
			}, [expiration, requestId, signIn, validationType])}
		>
			{children}
		</TenantForm>
	)

}
const errorToField: Record<TenantApi.SignInPasswordlessErrorCode, keyof PasswordlessSignInFormValues | undefined> = {
	PERSON_DISABLED: undefined,
	TOKEN_EXPIRED: 'token',
	TOKEN_NOT_FOUND: 'token',
	TOKEN_USED: 'token',
	TOKEN_INVALID: 'token',
	INVALID_OTP_TOKEN: 'otpToken',
	OTP_REQUIRED: undefined,
}
