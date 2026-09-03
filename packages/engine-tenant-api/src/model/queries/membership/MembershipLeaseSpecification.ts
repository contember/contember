import { ConditionBuilder, SelectBuilderSpecification } from '@contember/database'

/**
 * A32 — the point at which an expired lease stops granting anything.
 *
 * A membership granted by an IdP claim mapping with a `membershipLease` carries an expiry that every
 * successful sync pushes forward ({@link CreateOrUpdateProjectMembershipCommand}). Enforcement is here,
 * on the read that resolves memberships for an access decision, rather than in a reaper: a lease that
 * has lapsed must grant nothing from the instant it lapses, and that cannot be made to depend on a
 * background job having run. The sweep ({@link PurgeExpiredMembershipLeasesCommand}) only removes rows
 * this predicate has already made inert.
 *
 * `lease_expires_at IS NULL` is every unleased membership — every operator-managed one, and every grant
 * from a mapping that configures no lease — so a deployment that does not use the feature keeps exactly
 * the rows it kept before, and the partial index on the column stays empty. The comparison uses the
 * DATABASE clock, the same one that stamped the lease.
 *
 * Deliberately expressed as one raw predicate: the alternative (`where` + `orWhere` groups) would let a
 * caller AND its own conditions into the OR and silently widen access.
 */
export const withUnexpiredLease = (): SelectBuilderSpecification => qb =>
	qb.where((expr: ConditionBuilder) => expr.raw('("lease_expires_at" is null or "lease_expires_at" > now())'))
