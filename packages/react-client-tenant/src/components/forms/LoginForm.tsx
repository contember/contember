import { ReactElement, useCallback, useMemo } from 'react'
import * as TenantApi from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm'
import { SignInErrorCode } from '@contember/graphql-client-tenant'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { useSetSessionToken } from '@contember/react-client'
import { SignInMutationResult, useSignInMutation } from '../../hooks'
import { useRedirectToBacklinkCallback } from '../../internal/hooks/useRedirectToBacklink'


export type LoginFormValues = {
	email: string
	password: string
	otpToken: string
}

export type LoginFormErrorCode =
	| SignInErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type LoginFormState =
	| FormState
	| 'otp-required'

export type LoginFormError = FormError<LoginFormValues, LoginFormErrorCode>

export type LoginFormContextValue = FormContextValue<LoginFormValues, LoginFormErrorCode, LoginFormState>

export interface LoginFormProps {
	expiration?: number
	children: ReactElement
	onSuccess?: () => void
}

export const useLoginForm = useForm as () => LoginFormContextValue

const headers = {
	'X-Contember-Token-Path': 'data.mutation.result.token',
}

const DEFAULT_LOGIN_EXPIRATION = 14 * 24 * 60 // 14 days

export const LoginForm = ({ children, expiration = DEFAULT_LOGIN_EXPIRATION, onSuccess }: LoginFormProps) => {
	const login = useSignInMutation({ headers })
	const redirectToBacklink = useRedirectToBacklinkCallback()
	const setSessionToken = useSetSessionToken()
	return (
		<TenantForm<LoginFormContextValue, SignInMutationResult>
			onSuccess={args => {
				onSuccess?.()
				setSessionToken(args.result.token)
				redirectToBacklink()
			}}
			errorMapping={errorToField}
			initialValues={{
				email: '',
				password: '',
				otpToken: '',
			}}
			validate={({ values, state }) => {
				const errors: LoginFormError[] = []
				if (!values.email) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'email' })
				} else if (!values.email.match(/^.+@.+$/)) {
					errors.push({ code: 'INVALID_VALUE', field: 'email' })
				}

				if (!values.password) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'password' })
				} else if (values.password.length < 6) {
					errors.push({ code: 'INVALID_VALUE', field: 'password' })
				}
				if (!values.otpToken && state === 'otp-required') {
					errors.push({ code: 'FIELD_REQUIRED', field: 'otpToken' })
				} else if (values.otpToken && !values.otpToken.match(/^\d{6}$/)) {
					errors.push({ code: 'INVALID_VALUE', field: 'otpToken' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				const result = await login({
					email: values.email!,
					password: values.password!,
					otpToken: values.otpToken || undefined,
					expiration: expiration,
				})

				if (!result.ok && result.error === 'OTP_REQUIRED') {
					return { ...result, state: 'otp-required' }
				}

				return result
			}}
		>
			{children}
		</TenantForm>
	)

}
const errorToField: Record<TenantApi.SignInErrorCode, keyof LoginFormValues | undefined> = {
	'INVALID_PASSWORD': 'password',
	'NO_PASSWORD_SET': 'password',
	'UNKNOWN_EMAIL': 'email',
	'PERSON_DISABLED': 'email',
	'INVALID_OTP_TOKEN': 'otpToken',
	'OTP_REQUIRED': undefined,
}
