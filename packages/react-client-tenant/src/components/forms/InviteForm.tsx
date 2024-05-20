import { ReactElement } from 'react'
import { TenantForm } from './TenantForm'
import { FormContextValue, FormError, FormState } from '../../types'
import { useForm } from '../../contexts'
import { InviteErrorCode, InviteOptions, MembershipInput } from '@contember/graphql-client-tenant'
import { InviteMutationResult, useInviteMutation } from '../../hooks'

export type InviteFormValues = {
	email: string
	name: string
	memberships: readonly MembershipInput[]
}

export type InviteFormErrorCode =
	| InviteErrorCode
	| 'UNKNOWN_ERROR'
	| 'FIELD_REQUIRED'

export type InviteFormState = FormState

export type InviteFormError = FormError<InviteFormValues, InviteFormErrorCode>

export type InviteFormContextValue = FormContextValue<InviteFormValues, InviteFormErrorCode>

export interface InviteFormProps {
	children: ReactElement
	projectSlug: string
	inviteOptions?: InviteOptions
	initialMemberships?: readonly MembershipInput[]
	onSuccess?: (args: { result: InviteMutationResult }) => void
}

export const useInviteForm = useForm as () => InviteFormContextValue

export const InviteForm = ({ children, onSuccess, projectSlug, initialMemberships, inviteOptions }: InviteFormProps) => {
	const invite = useInviteMutation()
	return (
		<TenantForm<InviteFormContextValue, InviteMutationResult>
			onSuccess={onSuccess}
			initialValues={{
				email: '',
				name: '',
				memberships: initialMemberships || [],
			}}
			validate={({ values }) => {
				const errors: InviteFormError[] = []
				if (!values.email) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'email' })
				}
				if (values.memberships.length === 0) {
					errors.push({ code: 'FIELD_REQUIRED', field: 'memberships' })
				}
				return errors
			}}
			execute={async ({ values }) => {
				return await invite({
					email: values.email,
					name: values.name,
					projectSlug,
					options: inviteOptions,
					memberships: values.memberships,
				})
			}}
			errorMapping={errorToField}
		>
			{children}
		</TenantForm>
	)
}

const errorToField: Record<InviteErrorCode, keyof InviteFormValues | undefined> = {
	ALREADY_MEMBER: 'email',
	INVALID_EMAIL_FORMAT: 'email',
	INVALID_MEMBERSHIP: 'memberships',
	PROJECT_NOT_FOUND: undefined,
	ROLE_NOT_FOUND: 'memberships',
	VARIABLE_EMPTY: 'memberships',
	VARIABLE_NOT_FOUND: 'memberships',
}
