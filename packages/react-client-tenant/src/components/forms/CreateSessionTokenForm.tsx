import { ReactElement } from 'react'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { CreateSessionTokenErrorCode } from '@contember/graphql-client-tenant'
import { CreateSessionTokenMutationResult, useCreateSessionTokenMutation } from '../../hooks'

export type CreateSessionTokenFormValues = {
	email: string
}

export type CreateSessionTokenFormErrorCode =
	| CreateSessionTokenErrorCode
	| 'UNKNOWN_ERROR'
	| 'FIELD_REQUIRED'

export type CreateSessionTokenFormState = FormState

export type CreateSessionTokenFormError = FormError<CreateSessionTokenFormValues, CreateSessionTokenFormErrorCode>

export type CreateSessionTokenFormContextValue = FormContextValue<CreateSessionTokenFormValues, CreateSessionTokenFormErrorCode>

export interface CreateSessionTokenFormProps {
	children: ReactElement
	expiration?: number
	apiToken?: string
	onSuccess?: (args: { result: CreateSessionTokenMutationResult }) => void
}

export const useCreateSessionTokenForm = useForm as () => CreateSessionTokenFormContextValue

export const CreateSessionTokenForm = ({ children, onSuccess, expiration, apiToken }: CreateSessionTokenFormProps) => {
	const createSessionToken = useCreateSessionTokenMutation({ apiToken })
	return (
		<TenantForm<CreateSessionTokenFormContextValue, CreateSessionTokenMutationResult>
			onSuccess={onSuccess}
			initialValues={{
				email: '',
			}}
			validate={({ values }) => {
				const errors: CreateSessionTokenFormError[] = []
				if (!values.email) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'email' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await createSessionToken({
					email: values.email,
					expiration,
				})
			}}
			errorMapping={errorToField}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<CreateSessionTokenErrorCode, keyof CreateSessionTokenFormValues | undefined> = {
	PERSON_DISABLED: 'email',
	UNKNOWN_EMAIL: 'email',
	UNKNOWN_PERSON_ID: 'email',
}
