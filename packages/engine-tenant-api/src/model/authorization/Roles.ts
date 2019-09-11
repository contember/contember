import { Identity } from '@contember/engine-common'

export enum TenantRole {
	LOGIN = 'login',
	SETUP = 'setup',
	SELF = 'self',
	PERSON = 'person',
	PROJECT_MEMBER = 'project_member',
	PROJECT_ADMIN = 'project_admin',
}

export type AllRoles = TenantRole | Identity.SystemRole
