import { describe, expect, test } from 'bun:test'
import { createConnectionMock, type ExpectedQuery } from '@contember/database-tester'
import { Client, Connection } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import {
	AllProjectRolesByIdentityQuery,
	type Command,
	CommandBus,
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
	type TransactionOptions,
} from '../../../../src/index.js'
import { CreateAuthLogEntryCommand } from '../../../../src/model/commands/authLog/CreateAuthLogEntryCommand.js'
import { purgeExpiredMembershipLeasesSql } from '../../integration/mocked/sql/purgeExpiredMembershipLeasesSql.js'
import { sqlTransaction } from '../../integration/mocked/sql/sqlTransaction.js'
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

// The sweep swallows every failure, the mocked connection included, so its SQL expectations cannot fail a
// test. What it did is asserted on the commands themselves instead — these two record them on the way past.
class RecordingCommandBus<Conn extends Connection.ConnectionLike> extends CommandBus<Conn> {
	constructor(client: Client<Conn>, providers: Providers, private readonly executed: Command<unknown>[]) {
		super(client, providers)
	}

	public override async execute<T>(command: Command<T>): Promise<T> {
		this.executed.push(command)
		return await super.execute(command)
	}
}

class RecordingDbContext<Conn extends Connection.ConnectionLike = Connection.ConnectionLike> extends DatabaseContext<Conn> {
	constructor(client: Client<Conn>, providers: Providers, public readonly executed: Command<unknown>[] = []) {
		super(client, providers)
	}

	public override get commandBus(): CommandBus<Conn> {
		return new RecordingCommandBus(this.client, this.providers, this.executed)
	}

	public override async transaction<T>(
		cb: (db: DatabaseContext<Connection.TransactionLike>) => Promise<T>,
		options: TransactionOptions = {},
	): Promise<T> {
		return await super.transaction(db => cb(new RecordingDbContext(db.client, db.providers, this.executed)), options)
	}
}

const withMockedDb = async (expected: ExpectedQuery[], cb: (db: RecordingDbContext) => Promise<void>): Promise<void> => {
	const connection = createConnectionMock(expected)
	await cb(new RecordingDbContext(connection.createClient('tenant', { module: 'tenant' }), providers))
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
		const rejected = [
			'30',
			'days',
			'0 days',
			'-1 day',
			'1.5 days',
			'30 fortnights',
			"1 day'; drop",
			'',
			// postgres answers these two at `now() + ?::interval` time, where nothing can catch them any more:
			'200000000 days', // timestamp out of range
			'30\u00A0days', // invalid input syntax for type interval — that is a non-breaking space
		]
		for (const membershipLease of rejected) {
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

	test('an unleased grant clears the expiry, so it cannot land dead on a lapsed row', async () => {
		// This is an upsert on `(project_id, identity_id, role)`. An operator granting a role whose lease has
		// lapsed — a row the read path hides but the unique key still holds — updates THAT row, so leaving
		// the stale expiry alone would report success and grant nothing. Both columns are therefore written
		// as NULL, not omitted, and the membership belongs to whoever wrote it last.
		await withMockedDb([{
			sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role", "lease_expires_at", "identity_provider_id")
			         VALUES (?, ?, ?, ?, ?, ?)
			         ON CONFLICT ("project_id", "identity_id", "role")
			         DO UPDATE SET "role" = ?, "lease_expires_at" = ?, "identity_provider_id" = ?
			         RETURNING "id"`,
			parameters: [providers.uuid(), projectId, identityId, 'editor', null, null, 'editor', null, null],
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

	const auditInsertSql = (eventData: unknown): ExpectedQuery => ({
		sql: SQL`INSERT INTO "tenant"."person_auth_log" ("id", "person_id", "type", "success", "metadata", "target_person_id", "event_data")
		         VALUES (?, ?, ?, ?, ?, ?, ?)`,
		parameters: [providers.uuid(), 'person-1', 'idp_membership_lease_expired', true, {}, 'person-1', eventData],
		response: { rowCount: 1 },
	})

	test('one audit entry per person, naming each lapsed grantor; an identity with no person is removed silently', async () => {
		const memberships = [
			{ project: 'demo', role: 'editor', identityProviderId: 'idp-1' },
			{ project: 'demo', role: 'reviewer', identityProviderId: 'idp-2' },
		]
		await withMockedDb(
			sqlTransaction(
				purgeExpiredMembershipLeasesSql({
					limit: MEMBERSHIP_LEASE_SWEEP_LIMIT,
					rows: [
						{ identityId: 'identity-1', personId: 'person-1', project: 'demo', role: 'editor', identityProviderId: 'idp-1' },
						{ identityId: 'identity-1', personId: 'person-1', project: 'demo', role: 'reviewer', identityProviderId: 'idp-2' },
						// an API-key identity: nothing to audit against, but the membership still had to go
						{ identityId: 'identity-2', personId: null, project: 'demo', role: 'editor', identityProviderId: 'idp-1' },
					],
				}),
				auditInsertSql({ memberships }),
			),
			async db => {
				const handler = new TestLoggerHandler()
				await withLogger(createLogger(handler), async () => await new MembershipLeaseSweeper().sweep(db))

				// nothing was swallowed, so the mocked SQL above really was matched
				expect(handler.messages).toHaveLength(0)
				expect(db.executed.filter(it => it instanceof PurgeExpiredMembershipLeasesCommand)).toHaveLength(1)
				// one entry for person-1 and none for the API key; `identityProviderId` rides per membership,
				// the row column staying null because the sweep is global
				expect(db.executed.filter(it => it instanceof CreateAuthLogEntryCommand)).toEqual([
					new CreateAuthLogEntryCommand({
						type: 'idp_membership_lease_expired',
						personId: 'person-1',
						targetPersonId: 'person-1',
						success: true,
						eventData: { memberships },
					}),
				])
			},
		)
	})

	test('the delete and its audit are one transaction, so a crash cannot lose the record of what went', async () => {
		// asserted by the BEGIN / COMMIT the mock demands around both statements
		await withMockedDb(
			sqlTransaction(
				purgeExpiredMembershipLeasesSql({
					limit: MEMBERSHIP_LEASE_SWEEP_LIMIT,
					rows: [{ identityId: 'identity-1', personId: 'person-1', project: 'demo', role: 'editor', identityProviderId: null }],
				}),
				auditInsertSql({ memberships: [{ project: 'demo', role: 'editor', identityProviderId: null }] }),
			),
			async db => {
				const handler = new TestLoggerHandler()
				await withLogger(createLogger(handler), async () => await new MembershipLeaseSweeper().sweep(db))
				expect(handler.messages).toHaveLength(0)
			},
		)
	})

	test('a failing sweep is swallowed but logged — it is housekeeping riding on somebody else sign-in', async () => {
		class FailingDbContext extends DatabaseContext {
			public override async transaction<T>(): Promise<T> {
				throw new Error('deadlock')
			}
		}
		const db = new FailingDbContext(createConnectionMock([]).createClient('tenant', { module: 'tenant' }), providers)
		const handler = new TestLoggerHandler()
		await withLogger(createLogger(handler), async () => {
			expect(await new MembershipLeaseSweeper().sweep(db).then(() => 'resolved')).toBe('resolved')
		})
		// a permanently broken sweep must not be indistinguishable from an empty one
		expect(handler.messages).toHaveLength(1)
		expect(handler.messages[0].message).toContain('deadlock')
	})

	test('the delete is bounded, so a mass lapse cannot stall the request it rides on', async () => {
		await withMockedDb([purgeExpiredMembershipLeasesSql({ limit: 7 })], async db => {
			await db.commandBus.execute(new PurgeExpiredMembershipLeasesCommand(7))
		})
	})
})
