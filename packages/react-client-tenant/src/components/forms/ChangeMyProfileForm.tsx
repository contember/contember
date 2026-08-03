import { ReactElement, useMemo } from 'react'
import { ChangeMyProfileErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm, useIdentityMethods } from '../../contexts.js'
import { useChangeMyProfileMutation } from '../../hooks/index.js'

export type ChangeMyProfileFormValues = {
	email: string
	name: string
}

export type ChangeMyProfileFormErrorCode =
	| ChangeMyProfileErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type ChangeMyProfileFormState = FormState

export type ChangeMyProfileFormError = FormError<ChangeMyProfileFormValues, ChangeMyProfileFormErrorCode>

export type ChangeMyProfileFormContextValue = FormContextValue<ChangeMyProfileFormValues, ChangeMyProfileFormErrorCode>

export interface ChangeMyProfileFormProps {
	children: ReactElement
	/** Prefill the fields, typically from `useIdentity()`. */
	initialValues?: Partial<ChangeMyProfileFormValues>
	onSuccess?: () => void
}

export const useChangeMyProfileForm = useForm as () => ChangeMyProfileFormContextValue

export const ChangeMyProfileForm = ({ children, onSuccess, initialValues }: ChangeMyProfileFormProps) => {
	const changeMyProfile = useChangeMyProfileMutation()
	const { refreshIdentity } = useIdentityMethods()
	return (
		<TenantForm<ChangeMyProfileFormContextValue>
			onSuccess={async () => {
				await refreshIdentity()
				onSuccess?.()
			}}
			errorMapping={errorToField}
			initialValues={useMemo(() => ({
				email: initialValues?.email ?? '',
				name: initialValues?.name ?? '',
			}), [initialValues?.email, initialValues?.name])}
			validate={({ values }) => {
				const errors: ChangeMyProfileFormError[] = []
				if (values.email && !values.email.match(/^.+@.+$/)) {
					errors.push({ code: 'INVALID_VALUE', field: 'email' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await changeMyProfile({
					// An empty e-mail means "leave unchanged"; an empty name clears it (the API maps '' to null).
					email: values.email || undefined,
					name: values.name,
				})
			}}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<ChangeMyProfileErrorCode, keyof ChangeMyProfileFormValues | undefined> = {
	INVALID_EMAIL_FORMAT: 'email',
	EMAIL_ALREADY_EXISTS: 'email',
	NOT_A_PERSON: undefined,
	RATE_LIMIT_EXCEEDED: undefined,
}
