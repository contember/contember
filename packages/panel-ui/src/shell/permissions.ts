import { type Identity, type ProjectPermissions, useIdentity } from '@contember/react-client-tenant'
import { useProjectSlug } from '@contember/react-client'

/**
 * What the caller may do in a project, as `me { projects }` reports it.
 *
 * Returns `undefined` when the project is not among the identity's own — the panel cannot navigate
 * there anyway, and guessing "denied" would hide things on a project reached some other way. These
 * flags are advisory: the ACL still decides, so a wrong guess here must not lock anyone out.
 */
export const projectPermissionsOf = (identity: Identity, projectSlug: string | undefined): ProjectPermissions | undefined =>
	projectSlug === undefined ? undefined : identity.projects.find(it => it.slug === projectSlug)?.permissions

/** The current project's permissions, for a page rendered inside `ProjectScopeProvider`. */
export const useProjectPermissions = (): ProjectPermissions | undefined => {
	const identity = useIdentity()
	const projectSlug = useProjectSlug()
	return identity === undefined ? undefined : projectPermissionsOf(identity, projectSlug)
}

/**
 * Whether to offer an action whose permission flag may be unknown. Unknown means show it: the flags
 * exist to stop the UI promising what it cannot deliver, not to hide what it can.
 */
export const mayPerform = (flag: boolean | undefined): boolean => flag !== false
