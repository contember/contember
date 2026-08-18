import { ReactElement, useCallback, useMemo } from 'react'
import { SignUpErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/forms.js'
import { useForm } from '../../contexts.js'
import { SignUpMutationResult, useSignUpMutation } from '../../hooks/index.js'

export type SignUpFormValues = {
	email: string
	password: string
	passwordConfirmation: string
	name: string
}

export type SignUpFormErrorCode =
	| SignUpErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'PASSWORD_MISMATCH'
	| 'UNKNOWN_ERROR'

export type SignUpFormState = FormState

export type SignUpFormError = FormError<SignUpFormValues, SignUpFormErrorCode>

export type SignUpFormContextValue = FormContextValue<SignUpFormValues, SignUpFormErrorCode>

export interface SignUpFormProps {
	children: ReactElement
	/** Tenant roles for the new identity. Only a caller allowed to grant them may pass this. */
	roles?: readonly string[]
	captchaToken?: string
	onSuccess?: (args: { result: SignUpMutationResult }) => void
}

export const useSignUpForm = useForm as () => SignUpFormContextValue

/**
 * Open registration. Note that `signUp` only creates the account — it does not
 * sign anyone in, so a host app usually follows a success with `LoginForm` or,
 * when e-mail verification is required, with a "check your inbox" screen.
 */
export const SignUpForm = ({ children, onSuccess, roles, captchaToken }: SignUpFormProps) => {
	const signUp = useSignUpMutation()
	return (
		<TenantForm<SignUpFormContextValue, SignUpMutationResult>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={useMemo(() => ({
				email: '',
				password: '',
				passwordConfirmation: '',
				name: '',
			}), [])}
			validate={({ values }) => {
				const errors: SignUpFormError[] = []
				if (!values.email) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'email' })
				} else if (!values.email.match(/^.+@.+$/)) {
					errors.push({ code: 'INVALID_VALUE', field: 'email' })
				}
				if (!values.password) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'password' })
				} else if (values.password !== values.passwordConfirmation) {
					// Strength is the server's call (config.password) — only the typo check is ours.
					errors.push({ code: 'PASSWORD_MISMATCH', field: 'passwordConfirmation' })
				}
				return errors
			}}
			execute={useCallback(async ({ values }) => {
				return await signUp({
					email: values.email,
					password: values.password,
					name: values.name || undefined,
					roles,
					captchaToken,
				})
			}, [signUp, roles, captchaToken])}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<SignUpErrorCode, keyof SignUpFormValues | undefined> = {
	EMAIL_ALREADY_EXISTS: 'email',
	INVALID_EMAIL_FORMAT: 'email',
	TOO_WEAK: 'password',
	INVALID_CAPTCHA: undefined,
	RATE_LIMIT_EXCEEDED: undefined,
}
