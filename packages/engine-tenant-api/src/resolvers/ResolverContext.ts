import { DatabaseContext, Identity, PermissionContext, ProjectGroup } from '../model'

export interface ResolverContext {
	readonly apiKeyId: string
	readonly permissionContext: PermissionContext
	readonly identity: Identity
	readonly isAllowed: PermissionContext['isAllowed']
	readonly requireAccess: PermissionContext['requireAccess']
	readonly projectGroup: ProjectGroup
	readonly db: DatabaseContext
}
