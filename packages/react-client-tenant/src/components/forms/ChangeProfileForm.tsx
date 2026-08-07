import { ReactElement, useMemo } from 'react'
import { ChangeProfileErrorCode } from '@contember/graphql-client-tenant'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { useChangeProfileMutation } from '../../hooks/index.js'

export type ChangeProfileFormValues = {
	email: string
	name: string
}

export type ChangeProfileFormErrorCode =
	| ChangeProfileErrorCode
	| 'FIELD_REQUIRED'
	| 'INVALID_VALUE'
	| 'UNKNOWN_ERROR'

export type ChangeProfileFormState = FormState

export type ChangeProfileFormError = FormError<ChangeProfileFormValues, ChangeProfileFormErrorCode>

export type ChangeProfileFormContextValue = FormContextValue<ChangeProfileFormValues, ChangeProfileFormErrorCode>

export interface ChangeProfileFormProps {
	children: ReactElement
	personId: string
	/** Prefill the fields, typically from `usePersonQuery()`. */
	initialValues?: Partial<ChangeProfileFormValues>
	onSuccess?: () => void
}

export const useChangeProfileForm = useForm as () => ChangeProfileFormContextValue

export const ChangeProfileForm = ({ children, onSuccess, personId, initialValues }: ChangeProfileFormProps) => {
	const changeProfile = useChangeProfileMutation()
	return (
		<TenantForm<ChangeProfileFormContextValue>
			onSuccess={onSuccess}
			errorMapping={errorToField}
			initialValues={useMemo(() => ({
				email: initialValues?.email ?? '',
				name: initialValues?.name ?? '',
			}), [initialValues?.email, initialValues?.name])}
			validate={({ values }) => {
				const errors: ChangeProfileFormError[] = []
				if (values.email && !values.email.match(/^.+@.+$/)) {
					errors.push({ code: 'INVALID_VALUE', field: 'email' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await changeProfile({
					personId,
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

const errorToField: Record<ChangeProfileErrorCode, keyof ChangeProfileFormValues | undefined> = {
	INVALID_EMAIL_FORMAT: 'email',
	EMAIL_ALREADY_EXISTS: 'email',
	PERSON_NOT_FOUND: undefined,
}
