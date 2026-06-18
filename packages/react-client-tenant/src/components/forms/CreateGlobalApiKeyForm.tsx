import { ReactElement } from 'react'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { CreateApiKeyErrorCode } from '@contember/graphql-client-tenant'
import { CreateGlobalApiKeyMutationResult, useCreateGlobalApiKeyMutation } from '../../hooks/index.js'

export type CreateGlobalApiKeyFormValues = {
	description: string
	roles: readonly string[]
}

export type CreateGlobalApiKeyFormErrorCode =
	| CreateApiKeyErrorCode
	| 'UNKNOWN_ERROR'
	| 'FIELD_REQUIRED'

export type CreateGlobalApiKeyFormState = FormState

export type CreateGlobalApiKeyFormError = FormError<CreateGlobalApiKeyFormValues, CreateGlobalApiKeyFormErrorCode>

export type CreateGlobalApiKeyFormContextValue = FormContextValue<CreateGlobalApiKeyFormValues, CreateGlobalApiKeyFormErrorCode>

export interface CreateGlobalApiKeyFormProps {
	children: ReactElement
	initialRoles?: readonly string[]
	onSuccess?: (args: { result: CreateGlobalApiKeyMutationResult }) => void
}

export const useCreateGlobalApiKeyForm = useForm as () => CreateGlobalApiKeyFormContextValue

export const CreateGlobalApiKeyForm = ({ children, onSuccess, initialRoles }: CreateGlobalApiKeyFormProps) => {
	const createGlobalApiKey = useCreateGlobalApiKeyMutation()
	return (
		<TenantForm<CreateGlobalApiKeyFormContextValue, CreateGlobalApiKeyMutationResult>
			onSuccess={onSuccess}
			initialValues={{
				description: '',
				roles: initialRoles || [],
			}}
			validate={({ values }) => {
				const errors: CreateGlobalApiKeyFormError[] = []
				if (!values.description) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'description' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await createGlobalApiKey({
					description: values.description,
					roles: values.roles,
				})
			}}
			errorMapping={errorToField}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<CreateApiKeyErrorCode, keyof CreateGlobalApiKeyFormValues | undefined> = {
	INVALID_MEMBERSHIP: undefined,
	PROJECT_NOT_FOUND: undefined,
	ROLE_NOT_FOUND: 'roles',
	VARIABLE_EMPTY: undefined,
	VARIABLE_NOT_FOUND: undefined,
}
