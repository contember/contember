import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

export const createMembershipSql = (args: {
	membershipId: string
	identityId: string
	projectId: string
	role: string
	/** A32: present when an IdP claim mapping with a `membershipLease` granted (or renewed) this membership. */
	lease?: { duration: string; identityProviderId: string }
}): ExpectedQuery =>
	args.lease
		? {
			sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role", "lease_expires_at", "identity_provider_id")
			         VALUES (?, ?, ?, ?, now() + ?::interval, ?)
			         ON CONFLICT ("project_id", "identity_id", "role")
			         DO UPDATE SET "role" = ?, "lease_expires_at" = now() + ?::interval, "identity_provider_id" = ?
			         RETURNING "id"`,
			parameters: [
				args.membershipId,
				args.projectId,
				args.identityId,
				args.role,
				args.lease.duration,
				args.lease.identityProviderId,
				args.role,
				args.lease.duration,
				args.lease.identityProviderId,
			],
			response: { rows: [{ id: args.membershipId }] },
		}
		: {
			// A32: an unleased write CLEARS both columns. It is an upsert, so an operator granting a role
			// whose lease has lapsed lands on that row; keeping the stale expiry would report success and
			// grant nothing.
			sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role", "lease_expires_at", "identity_provider_id")
			         VALUES (?, ?, ?, ?, ?, ?)
			         ON CONFLICT ("project_id", "identity_id", "role")
			         DO UPDATE SET "role" = ?, "lease_expires_at" = ?, "identity_provider_id" = ?
			         RETURNING "id"`,
			parameters: [args.membershipId, args.projectId, args.identityId, args.role, null, null, args.role, null, null],
			response: { rows: [{ id: args.membershipId }] },
		}
