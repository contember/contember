import { ReactElement, useEffect, useState } from 'react'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { UpdateProjectMemberErrorCode, MembershipInput } from '@contember/graphql-client-tenant'
import { useProjectMembershipsQuery, useTenantQueryLoader, useUpdateProjectMemberMutation } from '../../hooks'

export type UpdateProjectMemberFormValues = {
	memberships: readonly MembershipInput[]
}

export type UpdateProjectMemberFormErrorCode =
	| UpdateProjectMemberErrorCode
	| 'UNKNOWN_ERROR'
	| 'FIELD_REQUIRED'

export type UpdateProjectMemberFormState = FormState

export type UpdateProjectMemberFormError = FormError<UpdateProjectMemberFormValues, UpdateProjectMemberFormErrorCode>

export type UpdateProjectMemberFormContextValue = FormContextValue<UpdateProjectMemberFormValues, UpdateProjectMemberFormErrorCode>

export interface UpdateProjectMemberFormProps {
	children: ReactElement
	identityId: string
	projectSlug: string
	onSuccess?: (args: { }) => void
}

export const useUpdateProjectMemberForm = useForm as () => UpdateProjectMemberFormContextValue

export const UpdateProjectMemberForm = ({ children, onSuccess, identityId, projectSlug }: UpdateProjectMemberFormProps) => {
	const updateProjectMember = useUpdateProjectMemberMutation()
	const [state] = useTenantQueryLoader(useProjectMembershipsQuery(), { projectSlug, identityId })
	const [memberships, setMemberships] = useState<readonly MembershipInput[]>()

	useEffect(() => {
		setMemberships(state.state === 'success' ? state.data : undefined)
	}, [state])

	return (
		<TenantForm<UpdateProjectMemberFormContextValue>
			onSuccess={onSuccess}
			loading={memberships === undefined}
			initialValues={memberships ? { memberships } : { memberships: [] }}
			onChange={({ values, submit }) => {
				setMemberships(values?.memberships)
			}}
			validate={({ values }) => {
				const errors: UpdateProjectMemberFormError[] = []
				if (values.memberships.length === 0) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'memberships' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await updateProjectMember({
					identityId,
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

const errorToField: Record<UpdateProjectMemberErrorCode, keyof UpdateProjectMemberFormValues | undefined> = {
	INVALID_MEMBERSHIP: 'memberships',
	PROJECT_NOT_FOUND: undefined,
	ROLE_NOT_FOUND: 'memberships',
	VARIABLE_EMPTY: 'memberships',
	VARIABLE_NOT_FOUND: 'memberships',
	NOT_MEMBER: undefined,
}
