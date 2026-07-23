import { LockType } from '@contember/database'
import { DatabaseContext } from '../utils/index.js'
import { IdentityHasProjectMembershipsQuery, IdentityQuery } from '../queries/index.js'
import { TargetIdentityPermissionTarget } from './PermissionActions.js'
import { batchLoader } from '../../utils/batchQuery.js'

const projectMembershipPresenceLoader = batchLoader<string, ReadonlySet<string>, boolean>(
	async (identityIds, db) => await db.queryHandler.fetch(new IdentityHasProjectMembershipsQuery(identityIds)),
	(identityId, identitiesWithMemberships) => identitiesWithMemberships.has(identityId),
)

export const createTargetIdentityPermissionTarget = async (
	db: DatabaseContext,
	identity: { readonly id: string; readonly roles: readonly string[] },
): Promise<TargetIdentityPermissionTarget> => ({
	id: identity.id,
	globalRoles: identity.roles,
	hasProjectMemberships: await db.batchLoad(projectMembershipPresenceLoader, identity.id),
})

export const lockTargetIdentityPermissionTarget = async (
	db: DatabaseContext,
	identityId: string,
): Promise<TargetIdentityPermissionTarget | null> => {
	const [identity] = await db.queryHandler.fetch(new IdentityQuery([identityId], LockType.forUpdate))
	return identity === undefined ? null : await createTargetIdentityPermissionTarget(db, identity)
}
