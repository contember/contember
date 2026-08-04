import { ReactElement } from 'react'
import { TenantForm } from './TenantForm.js'
import { FormContextValue, FormError, FormState } from '../../types/index.js'
import { useForm } from '../../contexts.js'
import { InviteErrorCode, InviteOptions, MembershipInput } from '@contember/graphql-client-tenant'
import { InviteMutationResult, useInviteMutation, useUnmanagedInviteMutation } from '../../hooks/index.js'

export type InviteFormValues = {
	email: string
	name: string
	memberships: readonly MembershipInput[]
	/** Switches to `unmanagedInvite`: create the member without sending mail. Ignored unless `allowUnmanaged`. */
	unmanaged: boolean
	/** Only read when `unmanaged` is set; empty means the account is created without a password. */
	password: string
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
	/**
	 * Lets the form submit through `unmanagedInvite` when `values.unmanaged` is
	 * set — no invitation e-mail, optionally with a password. Off by default, so
	 * a host app has to opt into offering it.
	 */
	allowUnmanaged?: boolean
	onSuccess?: (args: { result: InviteMutationResult }) => void
}

export const useInviteForm = useForm as () => InviteFormContextValue

export const InviteForm = (
	{ children, onSuccess, projectSlug, initialMemberships, inviteOptions, allowUnmanaged }: InviteFormProps,
) => {
	const invite = useInviteMutation()
	const unmanagedInvite = useUnmanagedInviteMutation()
	return (
		<TenantForm<InviteFormContextValue, InviteMutationResult>
			onSuccess={onSuccess}
			initialValues={{
				email: '',
				name: '',
				memberships: initialMemberships || [],
				unmanaged: false,
				password: '',
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
				if (allowUnmanaged && values.unmanaged) {
					return await unmanagedInvite({
						email: values.email,
						name: values.name,
						projectSlug,
						memberships: values.memberships,
						// An empty password creates the account without one — the person then
						// has to go through a password reset, which is a legitimate setup.
						options: values.password ? { password: values.password } : undefined,
					})
				}
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
