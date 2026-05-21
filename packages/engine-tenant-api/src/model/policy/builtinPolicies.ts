import { Policy } from '@contember/policy'
import { TenantRole } from '../authorization/Roles'
import { TenantActions } from './actions'

/**
 * Built-in policies that mirror the hardcoded TenantRole permissions in
 * PermissionsFactory. Source of truth lives here in code — `TenantDbPolicyProvider`
 * loads them directly per request and matches them against `identity.roles`.
 *
 * Custom user-defined policies live in the `tenant_policy` table and are added
 * via `PolicyService`; the `builtin:` slug prefix is reserved.
 *
 * Slug format: `builtin:<role>` — used only as a stable identifier in logs and
 * tests; it is never persisted to the DB.
 */
export interface BuiltinPolicyDefinition {
	role: TenantRole
	slug: string
	label: string
	description: string
	document: Policy
}

const allowAll = (actions: readonly string[]): Policy => ({
	version: '1',
	statements: [{ effect: 'allow', actions, resources: ['*'] }],
})

export const BUILTIN_POLICIES: readonly BuiltinPolicyDefinition[] = [
	{
		role: TenantRole.SUPER_ADMIN,
		slug: `builtin:${TenantRole.SUPER_ADMIN}`,
		label: 'Super Admin',
		description: 'Full unrestricted access to all tenant operations.',
		document: {
			version: '1',
			statements: [{ effect: 'allow', actions: ['*'], resources: ['*'] }],
		},
	},
	{
		role: TenantRole.LOGIN,
		slug: `builtin:${TenantRole.LOGIN}`,
		label: 'Login',
		description: 'Permissions required for sign-in flows.',
		document: allowAll([
			TenantActions.personSignIn,
			TenantActions.personResetPassword,
			TenantActions.personCreateIdpUrl,
			TenantActions.personSignInIdp,
			TenantActions.personPasswordlessSignIn,
			TenantActions.personRequestPasswordlessSignIn,
		]),
	},
	{
		role: TenantRole.PERSON,
		slug: `builtin:${TenantRole.PERSON}`,
		label: 'Person',
		description: 'Authenticated person: manage own profile, password, OTP and sessions.',
		document: allowAll([
			TenantActions.personView,
			TenantActions.personChangeMyPassword,
			TenantActions.personChangeMyProfile,
			TenantActions.personTogglePasswordless,
			TenantActions.personSignOut,
			TenantActions.personSetupOtp,
			TenantActions.personRevokeSession,
		]),
	},
	{
		role: TenantRole.PROJECT_MEMBER,
		slug: `builtin:${TenantRole.PROJECT_MEMBER}`,
		label: 'Project Member',
		description: 'View project metadata of projects the identity is a member of.',
		document: allowAll([TenantActions.projectView]),
	},
	{
		role: TenantRole.PROJECT_CREATOR,
		slug: `builtin:${TenantRole.PROJECT_CREATOR}`,
		label: 'Project Creator',
		description: 'Allowed to create new projects.',
		document: allowAll([TenantActions.projectCreate]),
	},
	{
		role: TenantRole.ENTRYPOINT_DEPLOYER,
		slug: `builtin:${TenantRole.ENTRYPOINT_DEPLOYER}`,
		label: 'Entrypoint Deployer',
		description: 'Deploy entrypoint changes.',
		document: allowAll([TenantActions.entrypointDeploy]),
	},
	{
		role: TenantRole.PROJECT_ADMIN,
		slug: `builtin:${TenantRole.PROJECT_ADMIN}`,
		label: 'Project Admin',
		description: 'Manage projects, members, identities, API keys, IdP and mail templates.',
		document: {
			version: '1',
			statements: [
				{
					effect: 'allow',
					actions: [
						TenantActions.projectView,
						TenantActions.identityViewPermissions,
						TenantActions.personView,
						TenantActions.apiKeyCreate,
						TenantActions.apiKeyDisable,
						TenantActions.apiKeyCreateGlobal,
						TenantActions.personSignUp,
						TenantActions.identityAddGlobalRoles,
						TenantActions.identityRemoveGlobalRoles,
						TenantActions.personCreateSessionToken,
						TenantActions.personDisable,
						TenantActions.personChangeProfile,
						TenantActions.personChangePassword,
						TenantActions.personForceSignOut,
						TenantActions.personRevokeSession,
						TenantActions.personViewSessions,
						TenantActions.projectViewMember,
						TenantActions.projectAddMember,
						TenantActions.projectUpdateMember,
						TenantActions.projectRemoveMember,
						TenantActions.personInvite,
						TenantActions.personInviteUnmanaged,
						TenantActions.mailTemplateAdd,
						TenantActions.mailTemplateRemove,
						TenantActions.mailTemplateList,
						TenantActions.idpAdd,
						TenantActions.idpUpdate,
						TenantActions.idpDisable,
						TenantActions.idpEnable,
						TenantActions.idpList,
						TenantActions.entrypointDeploy,
						TenantActions.systemConfigure,
						TenantActions.systemViewConfig,
						TenantActions.systemViewAuthLog,
					],
					resources: ['*'],
				},
				// Allowlist guard — mirrors `projectAdminAllowedInputRoles` in
				// PermissionsFactory: project_admin may grant/use only roles from
				// {LOGIN, PROJECT_ADMIN, ENTRYPOINT_DEPLOYER}. Anything else
				// (including SUPER_ADMIN, PROJECT_CREATOR, and arbitrary unknown
				// roles) is denied. `actionMapping.ts` defaults a missing
				// `meta.roles` to `[]` (NOT undefined) before evaluation, so the
				// `forAnyValue:stringNotEquals` deny returns `false` (no element
				// outside the allowlist) rather than firing on missing context —
				// reproducing the legacy verifier's "roles === undefined ⇒ pass".
				{
					effect: 'deny',
					actions: [
						TenantActions.identityAddGlobalRoles,
						TenantActions.identityRemoveGlobalRoles,
						TenantActions.apiKeyCreateGlobal,
						TenantActions.personSignUp,
					],
					resources: ['*'],
					conditions: {
						'forAnyValue:stringNotEquals': {
							'subject.roles': [
								TenantRole.LOGIN,
								TenantRole.PROJECT_ADMIN,
								TenantRole.ENTRYPOINT_DEPLOYER,
							],
						},
					},
				},
				// Denylist guard — mirrors `projectAdminUseRolesVerifier`:
				// cannot target identities that hold SUPER_ADMIN/PROJECT_CREATOR.
				{
					effect: 'deny',
					actions: [
						TenantActions.personCreateSessionToken,
						TenantActions.personDisable,
						TenantActions.personChangeProfile,
						TenantActions.personChangePassword,
						TenantActions.personForceSignOut,
						TenantActions.personViewSessions,
					],
					resources: ['*'],
					conditions: {
						'forAnyValue:stringEquals': {
							'subject.targetRoles': [TenantRole.SUPER_ADMIN, TenantRole.PROJECT_CREATOR],
						},
					},
				},
			],
		},
	},
]

export const builtinPolicyByRole = (role: string): BuiltinPolicyDefinition | undefined => BUILTIN_POLICIES.find(it => it.role === role)
