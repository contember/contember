import { ReactElement } from 'react'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { AddProjectMemberErrorCode, MembershipInput } from '@contember/graphql-client-tenant'
import { useAddProjectMemberMutation } from '../../hooks/index.js'

export type AddProjectMemberFormValues = {
	identityId: string
	memberships: readonly MembershipInput[]
}

export type AddProjectMemberFormErrorCode =
	| AddProjectMemberErrorCode
	| 'UNKNOWN_ERROR'
	| 'FIELD_REQUIRED'

export type AddProjectMemberFormState = FormState

export type AddProjectMemberFormError = FormError<AddProjectMemberFormValues, AddProjectMemberFormErrorCode>

export type AddProjectMemberFormContextValue = FormContextValue<AddProjectMemberFormValues, AddProjectMemberFormErrorCode>

export interface AddProjectMemberFormProps {
	children: ReactElement
	projectSlug: string
	initialMemberships?: readonly MembershipInput[]
	onSuccess?: (args: {}) => void
}

export const useAddProjectMemberForm = useForm as () => AddProjectMemberFormContextValue

export const AddProjectMemberForm = ({ children, onSuccess, projectSlug, initialMemberships }: AddProjectMemberFormProps) => {
	const addProjectMember = useAddProjectMemberMutation()
	return (
		<TenantForm<AddProjectMemberFormContextValue>
			onSuccess={onSuccess}
			initialValues={{
				identityId: '',
				memberships: initialMemberships || [],
			}}
			validate={({ values }) => {
				const errors: AddProjectMemberFormError[] = []
				if (!values.identityId) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'identityId' })
				}
				if (values.memberships.length === 0) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'memberships' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await addProjectMember({
					projectSlug,
					identityId: values.identityId,
					memberships: values.memberships,
				})
			}}
			errorMapping={errorToField}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<AddProjectMemberErrorCode, keyof AddProjectMemberFormValues | undefined> = {
	ALREADY_MEMBER: 'identityId',
	IDENTITY_NOT_FOUND: 'identityId',
	INVALID_MEMBERSHIP: 'memberships',
	PROJECT_NOT_FOUND: undefined,
	ROLE_NOT_FOUND: 'memberships',
	VARIABLE_EMPTY: 'memberships',
	VARIABLE_NOT_FOUND: 'memberships',
}
