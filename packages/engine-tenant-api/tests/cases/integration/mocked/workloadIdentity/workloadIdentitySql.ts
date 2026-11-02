import { ExpectedQuery } from '@contember/database-tester'
import { Acl } from '@contember/schema'
import { SQL } from '../../../../src/tags.js'
import { WorkloadIdentity } from '../../../../../src/model/type/index.js'

export interface TrustDbRow {
	id: string
	slug: string
	identity_id: string
	issuer: string
	audience: string
	profile: WorkloadIdentity.Profile
	jwks_uri: string | null
	signing_algs: string[]
	accepted_typ: (string | null)[]
	accept_audience_array: boolean
	require_dpop: boolean
	conditions: unknown
	max_token_lifetime_seconds: number
	tokens_valid_after_epoch: string
	trust_forwarded_info: boolean
	disabled: boolean
	description: string | null
	roles: string[]
	created_at: Date
	updated_at: Date
	tokens_valid_after: Date
}

export const trustTimestamp = new Date('2026-10-01T10:00:00.000Z')

export const trustDbRow = (overrides: Partial<TrustDbRow> & Pick<TrustDbRow, 'id' | 'slug' | 'identity_id'>): TrustDbRow => ({
	issuer: 'https://auth.example.com',
	audience: 'contember:test:web',
	profile: 'oidc',
	jwks_uri: null,
	signing_algs: ['ES256', 'RS256'],
	accepted_typ: ['JWT', null],
	accept_audience_array: false,
	require_dpop: false,
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
	max_token_lifetime_seconds: 3600,
	tokens_valid_after_epoch: String(trustTimestamp.getTime() / 1000),
	trust_forwarded_info: false,
	disabled: false,
	description: null,
	roles: [],
	created_at: trustTimestamp,
	updated_at: trustTimestamp,
	tokens_valid_after: trustTimestamp,
	...overrides,
})

const trustDetailSelect = SQL`select "workload_identity_trust"."id", "workload_identity_trust"."slug", "workload_identity_trust"."identity_id",
	"workload_identity_trust"."issuer", "workload_identity_trust"."audience", "workload_identity_trust"."profile",
	"workload_identity_trust"."jwks_uri", "workload_identity_trust"."signing_algs", "workload_identity_trust"."accepted_typ",
	"workload_identity_trust"."accept_audience_array", "workload_identity_trust"."require_dpop", "workload_identity_trust"."conditions",
	"workload_identity_trust"."max_token_lifetime_seconds",
	extract(epoch from "workload_identity_trust"."tokens_valid_after") as "tokens_valid_after_epoch",
	"workload_identity_trust"."trust_forwarded_info", "workload_identity_trust"."disabled_at" IS NOT NULL as "disabled",
	"identity"."description", "identity"."roles",
	"workload_identity_trust"."created_at", "workload_identity_trust"."updated_at", "workload_identity_trust"."tokens_valid_after"
	from "tenant"."workload_identity_trust"
	inner join "tenant"."identity" as "identity" on "identity"."id" = "workload_identity_trust"."identity_id"`

const trustDetailSql = (where: string, parameters: unknown[], rows: TrustDbRow[]): ExpectedQuery => ({
	sql: SQL`with "trust" as (${trustDetailSelect}${where === '' ? '' : ' ' + where}) select * from "trust" order by "trust"."slug" asc`,
	parameters,
	response: { rows },
})

export const trustBySlugSql = (slug: string, rows: TrustDbRow[]): ExpectedQuery =>
	trustDetailSql(SQL`where "workload_identity_trust"."slug" = ?`, [slug], rows)

export const trustByIdSql = (id: string, rows: TrustDbRow[]): ExpectedQuery =>
	trustDetailSql(SQL`where "workload_identity_trust"."id" = ?`, [id], rows)

export const trustByIdentitySql = (identityIds: string[], rows: TrustDbRow[]): ExpectedQuery =>
	trustDetailSql(SQL`where "workload_identity_trust"."identity_id" in (${identityIds.map(() => '?').join(', ')})`, identityIds, rows)

export const allTrustsSql = (rows: TrustDbRow[]): ExpectedQuery => trustDetailSql('', [], rows)

export interface TrustMembershipDbRow {
	id: string
	identityId: string
	projectId: string
	projectSlug: string
	role: string
	variables: Acl.MembershipVariable[]
	rule: unknown
}

export const trustMembershipsSql = (identityIds: string[], rows: TrustMembershipDbRow[]): ExpectedQuery => ({
	sql: SQL`with "memberships" as (select "project_membership"."id", "project_membership"."role", "project_membership"."identity_id",
			"project_membership"."project_id", "project"."slug" as "project_slug"
			from "tenant"."project_membership"
			inner join "tenant"."project" on "project"."id" = "project_membership"."project_id"
			where "project_membership"."identity_id" in (${identityIds.map(() => '?').join(', ')})),
		"variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables"
			from "tenant"."project_membership_variable"
			inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id"
			group by "membership_id")
		select "memberships"."id", "memberships"."identity_id" as "identityId", "memberships"."project_id" as "projectId",
			"memberships"."project_slug" as "projectSlug", "memberships"."role", coalesce(variables, '[]'::json) as "variables",
			"workload_identity_assume_rule"."rule"
		from "memberships"
		left join "variables" on "memberships"."id" = "variables"."membership_id"
		left join "tenant"."workload_identity_assume_rule" on "workload_identity_assume_rule"."membership_id" = "memberships"."id"
		order by "memberships"."project_slug" asc, "memberships"."role" asc`,
	parameters: identityIds,
	response: { rows },
})

export const identityKindSql = (identityId: string, kind: 'person' | 'api_key' | 'workload'): ExpectedQuery => ({
	sql: SQL`select "identity"."id",
			exists (select ?::int from "tenant"."person" where "person"."identity_id" = "identity"."id") as "is_person",
			exists (select ?::int from "tenant"."workload_identity_trust" where "workload_identity_trust"."identity_id" = "identity"."id") as "is_workload"
		from "tenant"."identity" where "identity"."id" in (?)`,
	parameters: [1, 1, identityId],
	response: { rows: [{ id: identityId, is_person: kind === 'person', is_workload: kind === 'workload' }] },
})

export interface TrustColumns {
	profile: WorkloadIdentity.Profile
	issuer: string
	audience: string
	jwksUri: string | null
	signingAlgs: string[]
	acceptedTyp: (string | null)[]
	acceptAudienceArray: boolean
	requireDpop: boolean
	conditions: unknown
	maxTokenLifetime: number
	trustForwardedInfo: boolean
}

export const defaultTrustColumns: TrustColumns = {
	profile: 'oidc',
	issuer: 'https://auth.example.com',
	audience: 'contember:test:web',
	jwksUri: null,
	signingAlgs: ['ES256', 'RS256'],
	acceptedTyp: ['JWT', null],
	acceptAudienceArray: false,
	requireDpop: false,
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
	maxTokenLifetime: 3600,
	trustForwardedInfo: false,
}

const trustColumnParameters = (columns: TrustColumns) => [
	columns.profile,
	columns.issuer,
	columns.audience,
	columns.jwksUri,
	columns.signingAlgs,
	columns.acceptedTyp,
	columns.acceptAudienceArray,
	columns.requireDpop,
	JSON.stringify(columns.conditions),
	columns.maxTokenLifetime,
	columns.trustForwardedInfo,
]

export const createTrustSql = (args: { id: string; slug: string; identityId: string; createdBy: string; columns?: TrustColumns }): ExpectedQuery => ({
	sql: SQL`insert into "tenant"."workload_identity_trust" ("id", "slug", "identity_id", "profile", "issuer", "audience", "jwks_uri",
			"signing_algs", "accepted_typ", "accept_audience_array", "require_dpop", "conditions", "max_token_lifetime_seconds",
			"trust_forwarded_info", "disabled_at", "created_by")
		values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	parameters: [args.id, args.slug, args.identityId, ...trustColumnParameters(args.columns ?? defaultTrustColumns), null, args.createdBy],
	response: { rowCount: 1 },
})

export const updateTrustSql = (args: { id: string; bump: boolean; disabled?: boolean; columns?: TrustColumns }): ExpectedQuery => ({
	sql: SQL`update "tenant"."workload_identity_trust" set "profile" = ?, "issuer" = ?, "audience" = ?, "jwks_uri" = ?, "signing_algs" = ?,
			"accepted_typ" = ?, "accept_audience_array" = ?, "require_dpop" = ?, "conditions" = ?, "max_token_lifetime_seconds" = ?,
			"trust_forwarded_info" = ?,
			"disabled_at" = ${args.disabled ? 'coalesce("disabled_at", now())' : '?'},
			"updated_at" = now()${args.bump ? ', "tokens_valid_after" = now()' : ''}
		where "id" = ?`,
	parameters: [...trustColumnParameters(args.columns ?? defaultTrustColumns), ...(args.disabled ? [] : [null]), args.id],
	response: { rowCount: 1 },
})

export const disableTrustSql = (slug: string, id: string | null): ExpectedQuery => ({
	sql: SQL`update "tenant"."workload_identity_trust" set "disabled_at" = coalesce("disabled_at", now()), "updated_at" = now()
		where "slug" = ? returning "id"`,
	parameters: [slug],
	response: { rows: id === null ? [] : [{ id }], rowCount: id === null ? 0 : 1 },
})

export const updateIdentitySql = (args: { identityId: string; roles: string[]; description: string | null }): ExpectedQuery => ({
	sql: SQL`update "tenant"."identity" set "roles" = ?, "description" = ? where "id" = ?`,
	parameters: [JSON.stringify(args.roles), args.description, args.identityId],
	response: { rowCount: 1 },
})

export const deleteAssumeRulesSql = (trustId: string): ExpectedQuery => ({
	sql: SQL`delete from "tenant"."workload_identity_assume_rule" where "trust_id" = ?`,
	parameters: [trustId],
	response: { rowCount: 1 },
})

export const insertAssumeRuleSql = (args: { id: string; trustId: string; membershipId: string; rule: Acl.MembershipMatchRule }): ExpectedQuery => ({
	sql: SQL`insert into "tenant"."workload_identity_assume_rule" ("id", "trust_id", "membership_id", "rule") values (?, ?, ?, ?)`,
	parameters: [args.id, args.trustId, args.membershipId, JSON.stringify(args.rule)],
	response: { rowCount: 1 },
})
