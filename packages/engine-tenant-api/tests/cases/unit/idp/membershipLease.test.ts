import { describe, expect, test } from 'bun:test'
import { createConnectionMock, type ExpectedQuery } from '@contember/database-tester'
import {
	AllProjectRolesByIdentityQuery,
	CreateOrUpdateProjectMembershipCommand,
	DatabaseContext,
	findClaimMappingShapeErrors,
	MEMBERSHIP_LEASE_SWEEP_LIMIT,
	MembershipLeaseSweeper,
	parseClaimMapping,
	ProjectMembershipByIdentityQuery,
	ProjectRolesByIdentityQuery,
	type Providers,
	PurgeExpiredMembershipLeasesCommand,
} from '../../../../src/index.js'
import { CreateAuthLogEntryCommand } from '../../../../src/model/commands/authLog/CreateAuthLogEntryCommand.js'
import { SQL } from '../../../src/tags.js'

// A32 — the lease itself, away from the sign-in / refresh flows that renew it: what a configured lease
// is allowed to say, what it writes, and the one place that makes an expired one grant nothing.

const providers: Providers = {
	bcrypt: async value => value,
	bcryptCompare: async () => true,
	now: () => new Date('2026-09-03T12:00:00Z'),
	randomBytes: async length => Buffer.alloc(length),
	uuid: () => 'aaaaaaaa-0000-0000-0000-000000000000',
	decrypt: async value => ({ value, needsReEncrypt: false }),
	encrypt: async value => ({ value, version: 1 }),
	encryptionEnabled: true,
	hash: value => Buffer.from(value.toString()),
}

const withMockedDb = async (expected: ExpectedQuery[], cb: (db: DatabaseContext) => Promise<void>): Promise<void> => {
	const connection = createConnectionMock(expected)
	await cb(new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers))
	expect(expected).toHaveLength(0)
}

const mapping = (input: Record<string, unknown>) => {
	const parsed = parseClaimMapping({ claimMapping: input })
	if (parsed === null) {
		throw new Error('expected a mapping')
	}
	return parsed
}

const rules = [{ claim: 'groups', contains: 'editors', grantMembership: { project: 'demo', role: 'editor' } }]

describe('A32 membership lease — what a lease may be configured with', () => {
	test("a lease is refused under unmatched: 'keep', explicit or defaulted", () => {
		// `keep` promises the mapping never revokes. A lease revokes MORE than a `keep` sync would: the sync
		// leaves an ungranted membership alone, while the lease — with nothing renewing it — lets it lapse.
		expect(findClaimMappingShapeErrors(mapping({ rules, membershipLease: '30 days' }))).toEqual([
			expect.stringContaining("'membershipLease' with unmatched: 'keep'"),
		])
		expect(findClaimMappingShapeErrors(mapping({ rules, unmatched: 'keep', membershipLease: '30 days' }))).toHaveLength(1)
	})

	test("a lease is refused under syncPolicy: 'sticky'", () => {
		// sticky applies once, at account creation — nothing would ever renew the grant it made
		expect(findClaimMappingShapeErrors(mapping({ rules, unmatched: 'remove', syncPolicy: 'sticky', membershipLease: '30 days' })))
			.toEqual([expect.stringContaining("'membershipLease' with syncPolicy: 'sticky'")])
	})

	test('a lease with remove + always is accepted', () => {
		expect(findClaimMappingShapeErrors(mapping({ rules, unmatched: 'remove', membershipLease: '30 days' }))).toEqual([])
		expect(findClaimMappingShapeErrors(mapping({ rules, unmatched: 'remove', syncPolicy: 'always', membershipLease: '12 hours' }))).toEqual([])
	})

	test('only a positive whole duration parses; anything else fails the mapping outright', () => {
		expect(mapping({ rules, unmatched: 'remove', membershipLease: ' 30  days ' }).membershipLease).toBe('30  days')
		for (const membershipLease of ['30', 'days', '0 days', '-1 day', '1.5 days', '30 fortnights', "1 day'; drop", '']) {
			expect(() => parseClaimMapping({ claimMapping: { rules, unmatched: 'remove', membershipLease } })).toThrow()
		}
	})
})

describe('A32 membership lease — what a grant writes', () => {
	const membership = { role: 'editor', variables: [] }
	const projectId = 'project-1'
	const identityId = 'identity-1'

	test('a leased grant stamps the expiry from the database clock and names its grantor, on insert and on renewal alike', async () => {
		await withMockedDb([{
			sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role", "lease_expires_at", "identity_provider_id")
			         VALUES (?, ?, ?, ?, now() + ?::interval, ?)
			         ON CONFLICT ("project_id", "identity_id", "role")
			         DO UPDATE SET "role" = ?, "lease_expires_at" = now() + ?::interval, "identity_provider_id" = ?
			         RETURNING "id"`,
			parameters: [providers.uuid(), projectId, identityId, 'editor', '30 days', 'idp-1', 'editor', '30 days', 'idp-1'],
			response: { rows: [{ id: 'membership-1' }] },
		}], async db => {
			await db.commandBus.execute(
				new CreateOrUpdateProjectMembershipCommand(projectId, identityId, membership, { duration: '30 days', identityProviderId: 'idp-1' }),
			)
		})
	})

	test('an unleased grant emits the statement it emitted before leases existed', async () => {
		// The regression guard for "off by default": no lease configured must mean no lease column, not a
		// column written as NULL — an operator-managed membership never acquires an expiry this way.
		await withMockedDb([{
			sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
			         VALUES (?, ?, ?, ?)
			         ON CONFLICT ("project_id", "identity_id", "role") DO UPDATE SET "role" = ?
			         RETURNING "id"`,
			parameters: [providers.uuid(), projectId, identityId, 'editor', 'editor'],
			response: { rows: [{ id: 'membership-1' }] },
		}], async db => {
			await db.commandBus.execute(new CreateOrUpdateProjectMembershipCommand(projectId, identityId, membership))
		})
	})
})

describe('A32 membership lease — an expired lease grants nothing', () => {
	// Every read that resolves memberships or project roles for an access decision carries the same
	// predicate, so a lapsed grant disappears from all of them at once and needs no sweep to become inert.
	// It is ANDed with each query own conditions — never ORed into them, which would widen access.

	test('memberships in a project are filtered — the read behind every content/system/actions request', async () => {
		await withMockedDb([{
			sql: SQL`
				with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id"
				                       from "tenant"."project_membership"
				                       where "identity_id" IN (?) and "project_id" = ?
				                         and ("lease_expires_at" is null or "lease_expires_at" > now())),
					"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"
					                from "tenant"."project_membership_variable"
						                     inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id"
					                group by "membership_id")
				select "role", coalesce(variables, '[]'::json) as "variables", "identity_id" as "identityId"
				from "memberships"
					     left join "variables" on "memberships"."id" = "variables"."membership_id"`,
			parameters: ['identity-1', 'project-1'],
			response: { rows: [] },
		}], async db => {
			await db.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: 'project-1' }, ['identity-1']))
		})
	})

	test('project roles in a project are filtered', async () => {
		await withMockedDb([{
			sql: SQL`select "role" from "tenant"."project_membership"
			         where "identity_id" = ? and "project_id" = ? and ("lease_expires_at" is null or "lease_expires_at" > now())`,
			parameters: ['identity-1', 'project-1'],
			response: { rows: [] },
		}], async db => {
			await db.queryHandler.fetch(new ProjectRolesByIdentityQuery({ id: 'project-1' }, 'identity-1'))
		})
	})

	test('project roles across all projects are filtered — the session policy and the panel decide on these', async () => {
		await withMockedDb([{
			sql: SQL`select "project_id", "role" from "tenant"."project_membership"
			         where "identity_id" = ? and ("lease_expires_at" is null or "lease_expires_at" > now())`,
			parameters: ['identity-1'],
			response: { rows: [] },
		}], async db => {
			await db.queryHandler.fetch(new AllProjectRolesByIdentityQuery('identity-1'))
		})
	})
})

describe('A32 membership lease — the hygiene sweep', () => {
	// The sweep is not what makes an expired lease harmless — the filter above already did that. It clears
	// the residue: rows that grant nothing but still occupy their membership unique key.
	// `FOR UPDATE SKIP LOCKED` and the repeated `lease_expires_at <= now()` on the DELETE are both
	// load-bearing, not decoration: without the repeat, a row renewed by a sign-in committing while this
	// statement waits on it is still deleted, because Postgres re-checks only the outer qualification.
	const sweepSql = (limit: number, rows: Record<string, unknown>[]): ExpectedQuery => ({
		sql: SQL`WITH "expired" AS (
				DELETE FROM "project_membership"
				WHERE "id" IN (
					SELECT "id" FROM "project_membership"
					WHERE "lease_expires_at" <= now()
					ORDER BY "lease_expires_at"
					LIMIT ?
					FOR UPDATE SKIP LOCKED
				)
				AND "lease_expires_at" <= now()
				RETURNING "identity_id", "project_id", "role"
			)
			SELECT "expired"."identity_id" AS "identityId", "project"."slug" AS "project", "expired"."role" AS "role", "person"."id" AS "personId"
			FROM "expired"
			INNER JOIN "project" ON "project"."id" = "expired"."project_id"
			LEFT JOIN "person" ON "person"."identity_id" = "expired"."identity_id"`,
		parameters: [limit],
		response: { rows },
	})

	test('one audit entry per person, listing what they lost; an identity with no person is removed silently', async () => {
		await withMockedDb([
			sweepSql(MEMBERSHIP_LEASE_SWEEP_LIMIT, [
				{ identityId: 'identity-1', personId: 'person-1', project: 'demo', role: 'editor' },
				{ identityId: 'identity-1', personId: 'person-1', project: 'demo', role: 'reviewer' },
				// an API-key identity: nothing to audit against, but the membership still had to go
				{ identityId: 'identity-2', personId: null, project: 'demo', role: 'editor' },
			]),
			{
				sql: SQL`INSERT INTO "tenant"."person_auth_log" ("id", "person_id", "type", "success", "metadata", "target_person_id", "event_data")
				         VALUES (?, ?, ?, ?, ?, ?, ?)`,
				// no invoked_by_id and no identity_provider_id: nobody acted, and the sweep is global — the
				// sign-in that happened to trigger it is not the provider whose grant lapsed
				parameters: [
					providers.uuid(),
					'person-1',
					'idp_membership_lease_expired',
					true,
					{},
					'person-1',
					{ memberships: [{ project: 'demo', role: 'editor' }, { project: 'demo', role: 'reviewer' }] },
				],
				response: { rowCount: 1 },
			},
		], async db => {
			await new MembershipLeaseSweeper().sweep(db)
		})
	})

	test('a failing sweep is swallowed — it is housekeeping riding on somebody else sign-in', async () => {
		const db = new DatabaseContext(createConnectionMock([]).createClient('tenant', { module: 'tenant' }), providers)
		db.commandBus.execute = async () => {
			throw new Error('deadlock')
		}
		expect(await new MembershipLeaseSweeper().sweep(db).then(() => 'resolved')).toBe('resolved')
	})

	test('the delete is bounded, so a mass lapse cannot stall the request it rides on', async () => {
		await withMockedDb([sweepSql(7, [])], async db => {
			await db.commandBus.execute(new PurgeExpiredMembershipLeasesCommand(7))
		})
	})
})
