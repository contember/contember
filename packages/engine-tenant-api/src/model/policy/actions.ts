/**
 * Action namespace for the tenant API.
 *
 * Format: `tenant:<resource>.<verb>`. Resources mirror PermissionActions.Resources;
 * verbs mirror the action names defined there. Resources include:
 *   system, identity, person, project, apiKey, mailTemplate, idp, entrypoint, policy
 *
 * Resources (the object an action targets) are referenced as ARN-like strings
 * in policy statements. NOTE: the tenant authorization layer
 * (`PermissionContext`) only ever evaluates against two resource values today:
 * `*` (the global scope) and `project:<slug>` (a project scope). There is no
 * per-object resource such as `person:<id>` — finer targeting must be expressed
 * with conditions, not the resource string.
 */

export const TenantActions = {
	// system
	systemConfigure: 'tenant:system.configure',
	systemViewConfig: 'tenant:system.viewConfig',
	systemViewAuthLog: 'tenant:system.viewAuthLog',

	// identity
	identityViewPermissions: 'tenant:identity.viewPermissions',
	identityAddGlobalRoles: 'tenant:identity.addGlobalRoles',
	identityRemoveGlobalRoles: 'tenant:identity.removeGlobalRoles',

	// person
	personView: 'tenant:person.view',
	personSignIn: 'tenant:person.signIn',
	personSignUp: 'tenant:person.signUp',
	personSignOut: 'tenant:person.signOut',
	personDisable: 'tenant:person.disable',
	personSetupOtp: 'tenant:person.setupOtp',
	personChangeProfile: 'tenant:person.changeProfile',
	personChangeMyProfile: 'tenant:person.changeMyProfile',
	personChangePassword: 'tenant:person.changePassword',
	personChangeMyPassword: 'tenant:person.changeMyPassword',
	personResetPassword: 'tenant:person.resetPassword',
	personTogglePasswordless: 'tenant:person.togglePasswordless',
	personCreateIdpUrl: 'tenant:person.createIdPUrl',
	personSignInIdp: 'tenant:person.signInIdp',
	personRequestPasswordlessSignIn: 'tenant:person.requestPasswordlessSignIn',
	personPasswordlessSignIn: 'tenant:person.passwordlessSignIn',
	personCreateSessionToken: 'tenant:person.createSessionToken',
	personInvite: 'tenant:person.invite',
	personInviteUnmanaged: 'tenant:person.inviteUnmanaged',
	personForceSignOut: 'tenant:person.forceSignOut',
	personRevokeSession: 'tenant:person.revokeSession',
	personViewSessions: 'tenant:person.viewSessions',
	personResetMfa: 'tenant:person.resetMfa',

	// project
	projectView: 'tenant:project.view',
	projectCreate: 'tenant:project.create',
	projectUpdate: 'tenant:project.update',
	projectSetSecret: 'tenant:project.setSecret',
	projectViewMember: 'tenant:project.viewMember',
	projectAddMember: 'tenant:project.addMember',
	projectUpdateMember: 'tenant:project.updateMember',
	projectRemoveMember: 'tenant:project.removeMember',

	// api key
	apiKeyCreate: 'tenant:apiKey.create',
	apiKeyCreateGlobal: 'tenant:apiKey.createGlobal',
	apiKeyDisable: 'tenant:apiKey.disable',

	// mail template
	mailTemplateAdd: 'tenant:mailTemplate.add',
	mailTemplateRemove: 'tenant:mailTemplate.remove',
	mailTemplateList: 'tenant:mailTemplate.list',

	// idp
	idpAdd: 'tenant:idp.add',
	idpUpdate: 'tenant:idp.update',
	idpDisable: 'tenant:idp.disable',
	idpEnable: 'tenant:idp.enable',
	idpList: 'tenant:idp.list',

	// entrypoint
	entrypointDeploy: 'tenant:entrypoint.deploy',

	// policy management itself
	policyView: 'tenant:policy.view',
	policyCreate: 'tenant:policy.create',
	policyUpdate: 'tenant:policy.update',
	policyDelete: 'tenant:policy.delete',
	policyAssign: 'tenant:policy.assign',
	policyRevoke: 'tenant:policy.revoke',
} as const

export type TenantAction = typeof TenantActions[keyof typeof TenantActions]

/**
 * Build canonical resource strings.
 *
 * Only `project` and `any` are emitted/evaluated by the current tenant
 * authorization layer (see the note at the top of this file). Per-object
 * builders were removed to avoid suggesting a resource granularity the engine
 * does not actually evaluate.
 */
export const TenantResources = {
	project: (slug: string) => `project:${slug}`,
	any: '*',
}
