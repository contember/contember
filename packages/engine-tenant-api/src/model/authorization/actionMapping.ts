import { Authorizator } from '@contember/authorization'
import { Acl } from '@contember/schema'
import { EvaluationContext } from '@contember/policy'
import { Identity } from './Identity.js'
import { PermissionActions } from './PermissionActions.js'

/**
 * Shape of `action.meta` after the authorizator erases its generic. The fields
 * mirror the meta types declared on the action creators in `PermissionActions`,
 * so renaming a field there breaks both the creation and the read below.
 */
type ActionMeta = Partial<PermissionActions.RolesMeta & PermissionActions.MembershipsMeta>

/**
 * Result of translating a legacy `Authorizator.Action` into a policy engine
 * (action, context) call.
 *
 * If `subjectMemberships` is `undefined`, the caller performs a single engine
 * evaluation against `baseContext`. If it is a defined array (possibly empty),
 * the caller iterates one engine call per membership and AND-reduces the
 * results — this mirrors the legacy semantics where membership-aware actions
 * were authorized only if EVERY subject membership was individually allowed
 * by the invoker's role. An empty array means "no subject memberships to
 * check" — the outer pre-check still runs with `baseContext`.
 */
export interface TranslatedAction {
	engineAction: string
	baseContext: EvaluationContext
	subjectMemberships?: readonly Acl.Membership[]
}

/**
 * Map legacy privilege names whose engine verb differs from the legacy verb.
 * Built-in policies (and `TenantActions`) settled on shorter verbs.
 */
const PRIVILEGE_OVERRIDE: Record<string, string> = {
	'person.invite_unmanaged': 'inviteUnmanaged',
	'project.viewMembers': 'viewMember',
	'entrypoint.deployEntrypoint': 'deploy',
}

/**
 * Actions whose `meta.roles` describes roles the invoker wants to grant/use.
 * Built-in `project_admin` policies guard these via a `forAnyValue:stringNotEquals`
 * deny on `subject.roles` — anything outside the allowlist denies.
 */
const ALLOWLIST_ROLE_ACTIONS = new Set([
	'identity.addGlobalRoles',
	'identity.removeGlobalRoles',
	'apiKey.createGlobal',
	'person.signUp',
])

/**
 * Actions whose `meta.roles` describes roles already held by the target
 * identity. Built-in `project_admin` policies guard these via a
 * `forAnyValue:stringEquals` deny on `subject.targetRoles` — targeting a
 * protected role (super_admin / project_creator) denies.
 */
const DENYLIST_TARGET_ROLE_ACTIONS = new Set([
	'person.disable',
	'person.changeProfile',
	'person.changePassword',
	'person.createSessionToken',
	'person.forceSignOut',
	'person.viewSessions',
	'person.resetMfa',
])

/**
 * Actions whose `meta.memberships` is a list of project memberships the
 * invoker wants to grant or operate on. Each membership must be individually
 * authorized — the caller iterates one engine call per membership and
 * AND-reduces the results.
 */
const MEMBERSHIP_ACTIONS = new Set([
	'person.invite',
	'person.invite_unmanaged',
	'project.viewMembers',
	'project.addMember',
	'project.updateMember',
	'project.removeMember',
])

export function translateAction(action: Authorizator.Action, identity: Identity): TranslatedAction {
	const key = `${action.resource}.${action.privilege}`
	const verb = PRIVILEGE_OVERRIDE[key] ?? action.privilege
	const engineAction = `tenant:${action.resource}.${verb}`

	const baseContext: EvaluationContext = {
		identity: { id: identity.id, roles: identity.roles },
	}

	// For verifier-guarded actions, default missing meta to [] (NOT undefined).
	// Legacy verifiers treat `roles === undefined` as PASS. Built-in deny
	// statements use `forAnyValue:*` which returns 'missing' for absent context
	// paths — under deny that fires fail-closed. Defaulting to [] makes the
	// operator return false instead of 'missing', so the deny doesn't fire and
	// the underlying allow applies — matching legacy.
	const meta = action.meta as ActionMeta | undefined
	if (ALLOWLIST_ROLE_ACTIONS.has(key)) {
		const roles = meta?.roles ?? []
		return { engineAction, baseContext: { ...baseContext, subject: { roles } } }
	}
	if (DENYLIST_TARGET_ROLE_ACTIONS.has(key)) {
		const roles = meta?.roles ?? []
		return { engineAction, baseContext: { ...baseContext, subject: { targetRoles: roles } } }
	}
	if (MEMBERSHIP_ACTIONS.has(key)) {
		const memberships = meta?.memberships ?? []
		return { engineAction, baseContext, subjectMemberships: memberships }
	}
	return { engineAction, baseContext }
}
