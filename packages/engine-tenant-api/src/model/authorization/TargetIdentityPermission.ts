import { DatabaseContext } from '../utils/index.js'
import { IdentityHasProjectMembershipsQuery, IdentityQuery, IdentityQueryResult } from '../queries/index.js'
import { TargetIdentityPermissionTarget } from './PermissionActions.js'
import { TenantRole } from './Roles.js'
import { batchLoader } from '../../utils/batchQuery.js'

const projectMembershipPresenceLoader = batchLoader<string, ReadonlySet<string>, boolean>(
	async (identityIds, db) => await db.queryHandler.fetch(new IdentityHasProjectMembershipsQuery(identityIds)),
	(identityId, identitiesWithMemberships) => identitiesWithMemberships.has(identityId),
)

/** Batches the identity lookup that precedes a target-identity permission check. */
export const targetIdentityLoader = batchLoader<string, Record<string, IdentityQueryResult>, IdentityQueryResult | undefined>(
	async (identityIds, db) => {
		const identities = await db.queryHandler.fetch(new IdentityQuery(identityIds))
		return Object.fromEntries(identities.map(identity => [identity.id, identity]))
	},
	(identityId, identities) => identities[identityId],
)

export const createTargetIdentityPermissionTarget = async (
	db: DatabaseContext,
	identity: { readonly id: string; readonly roles: readonly string[] },
): Promise<TargetIdentityPermissionTarget> => ({
	id: identity.id,
	globalRoles: identity.roles,
	hasProjectMemberships: identity.roles.includes(TenantRole.SUPER_ADMIN)
		|| identity.roles.includes(TenantRole.PROJECT_ADMIN)
		|| await db.batchLoad(projectMembershipPresenceLoader, identity.id),
})

/** Convenience for the common case where the caller already holds the target's person row. */
export const createPersonPermissionTarget = async (
	db: DatabaseContext,
	person: { readonly identity_id: string; readonly roles: readonly string[] } | null,
): Promise<TargetIdentityPermissionTarget | null> =>
	person === null ? null : await createTargetIdentityPermissionTarget(db, { id: person.identity_id, roles: person.roles })
