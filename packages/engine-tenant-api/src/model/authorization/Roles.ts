export enum TenantRole {
	LOGIN = 'login',
	SELF = 'self',
	PERSON = 'person',
	SUPER_ADMIN = 'super_admin',
	PROJECT_CREATOR = 'project_creator',
	PROJECT_MEMBER = 'project_member',
	PROJECT_ADMIN = 'project_admin',
	ENTRYPOINT_DEPLOYER = 'entrypoint_deployer',
}

/**
 * Roles no delegated authority may ever grant, hold as a target, or impersonate.
 * Keep it the single source, so a newly protected role cannot be added to one path only.
 */
export const NON_DELEGABLE_TENANT_ROLES: ReadonlySet<string> = new Set([
	TenantRole.SUPER_ADMIN,
	TenantRole.PROJECT_CREATOR,
])
