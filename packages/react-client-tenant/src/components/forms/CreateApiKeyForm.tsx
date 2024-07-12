import { ReactElement } from 'react'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { CreateApiKeyErrorCode, MembershipInput } from '@contember/graphql-client-tenant'
import { CreateApiKeyMutationResult, useCreateApiKeyMutation } from '../../hooks'

export type CreateApiKeyFormValues = {
	description: string
	memberships: readonly MembershipInput[]
}

export type CreateApiKeyFormErrorCode =
	| CreateApiKeyErrorCode
	| 'UNKNOWN_ERROR'
	| 'FIELD_REQUIRED'

export type CreateApiKeyFormState = FormState

export type CreateApiKeyFormError = FormError<CreateApiKeyFormValues, CreateApiKeyFormErrorCode>

export type CreateApiKeyFormContextValue = FormContextValue<CreateApiKeyFormValues, CreateApiKeyFormErrorCode>

export interface CreateApiKeyFormProps {
	children: ReactElement
	projectSlug: string
	initialMemberships?: readonly MembershipInput[]
	onSuccess?: (args: { result: CreateApiKeyMutationResult }) => void
}

export const useCreateApiKeyForm = useForm as () => CreateApiKeyFormContextValue

export const CreateApiKeyForm = ({ children, onSuccess, projectSlug, initialMemberships }: CreateApiKeyFormProps) => {
	const createApiKey = useCreateApiKeyMutation()
	return (
		<TenantForm<CreateApiKeyFormContextValue, CreateApiKeyMutationResult>
			onSuccess={onSuccess}
			initialValues={{
				description: '',
				memberships: initialMemberships || [],
			}}
			validate={({ values }) => {
				const errors: CreateApiKeyFormError[] = []
				if (!values.description) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'description' })
				}
				if (values.memberships.length === 0) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'memberships' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await createApiKey({
					description: values.description,
					projectSlug,
					memberships: values.memberships,
				})
			}}
			errorMapping={errorToField}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<CreateApiKeyErrorCode, keyof CreateApiKeyFormValues | undefined> = {
	INVALID_MEMBERSHIP: 'memberships',
	PROJECT_NOT_FOUND: undefined,
	ROLE_NOT_FOUND: 'memberships',
	VARIABLE_EMPTY: 'memberships',
	VARIABLE_NOT_FOUND: 'memberships',
}
