import * as React from 'react'
import { useState } from 'react'
import { Button, Input, ToastContent, useShowToast } from '@contember/react-ui-lib-base'
import { PlusIcon, XIcon } from 'lucide-react'
import { toFormErrorCode, useAddGlobalIdentityRolesMutation, useRemoveGlobalIdentityRolesMutation } from '@contember/react-client-tenant'
import { AddGlobalIdentityRolesErrorCode, RemoveGlobalIdentityRolesErrorCode } from '@contember/graphql-client-tenant'
import { dict } from '../dict.js'
import { actionErrorMessage } from '../errors.js'

export interface GlobalRolesControlProps {
	identityId: string
	roles: readonly string[]
	onChange?: () => void
}

/**
 * `GlobalRolesControl` manages the global (tenant-wide) roles of an identity.
 *
 * ## Example
 * ```tsx
 * <GlobalRolesControl identityId={person.identity.id} roles={person.identity.roles ?? []} onChange={refresh} />
 * ```
 */
export const GlobalRolesControl = ({ identityId, roles, onChange }: GlobalRolesControlProps) => {
	const addRoles = useAddGlobalIdentityRolesMutation()
	const removeRoles = useRemoveGlobalIdentityRolesMutation()
	const showToast = useShowToast()
	const [newRole, setNewRole] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const onError = (code: AddGlobalIdentityRolesErrorCode | RemoveGlobalIdentityRolesErrorCode | undefined) => {
		const message = (code && dict.tenant.globalRoles.errorMessages[code]) ?? dict.tenant.globalRoles.errorMessages.UNKNOWN_ERROR
		showToast(<ToastContent>{message}</ToastContent>, { type: 'error' })
	}

	const onThrown = (error: unknown) => {
		const message = actionErrorMessage(toFormErrorCode(error), dict.tenant.globalRoles.errorMessages.UNKNOWN_ERROR)
		showToast(<ToastContent>{message}</ToastContent>, { type: 'error' })
	}

	const onAdd = async () => {
		const role = newRole.trim()
		if (!role) {
			return
		}
		setSubmitting(true)
		try {
			const result = await addRoles({ identityId, roles: [role] })
			if (result.ok) {
				setNewRole('')
				showToast(<ToastContent>{dict.tenant.globalRoles.addSuccess}</ToastContent>, { type: 'success' })
			} else {
				onError(result.error)
			}
		} catch (error) {
			// A denied mutation throws rather than answering `ok: false` — without this the control
			// would stay disabled forever with nothing said. Reachable: a project admin cannot grant
			// a global role, and `PersonDetail` renders this for them.
			onThrown(error)
		} finally {
			setSubmitting(false)
		}
		onChange?.()
	}

	const onRemove = async (role: string) => {
		setSubmitting(true)
		try {
			const result = await removeRoles({ identityId, roles: [role] })
			if (result.ok) {
				showToast(<ToastContent>{dict.tenant.globalRoles.removeSuccess}</ToastContent>, { type: 'success' })
			} else {
				onError(result.error)
			}
		} catch (error) {
			onThrown(error)
		} finally {
			setSubmitting(false)
		}
		onChange?.()
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex gap-2 flex-wrap items-center">
				{roles.length === 0 && <span className="text-gray-400 italic">{dict.tenant.globalRoles.noRoles}</span>}
				{roles.map(role => (
					<span key={role} className="inline-flex items-center gap-1 border border-gray-200 rounded-sm pl-2 py-0.5 text-sm">
						{role}
						<Button type="button" variant="ghost" size="xs" disabled={submitting} onClick={() => onRemove(role)}>
							<XIcon className="w-3 h-3" />
							<span className="sr-only">{dict.tenant.globalRoles.removeRole}</span>
						</Button>
					</span>
				))}
			</div>
			<div className="flex gap-2 items-center">
				{/* The tenant API cannot enumerate the roles defined in the config, so a new role is entered as free text. */}
				<Input
					type="text"
					value={newRole}
					placeholder={dict.tenant.globalRoles.rolePlaceholder}
					disabled={submitting}
					onChange={e => setNewRole(e.target.value)}
				/>
				<Button type="button" variant="outline" className="flex gap-2" disabled={submitting || !newRole.trim()} onClick={onAdd}>
					<PlusIcon className="w-4 h-4" />
					{dict.tenant.globalRoles.addRole}
				</Button>
			</div>
		</div>
	)
}
