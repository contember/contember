import { executeTenantTest } from '../../../src/testTenant.js'
import { expect, test } from 'bun:test'
import { GQL } from '../../../src/tags.js'
import { sqlTransaction } from './sql/sqlTransaction.js'

// Config-time validation of an A09 claimMapping at addIDP. The same `assertValidClaimMapping` guards
// updateIDP. Each rejection fails before any DB write — the validator runs inside the transaction but
// before the existence check / insert — so the only SQL is the (empty) transaction envelope.
//
// The test harness's project schema resolver returns a schema whose ACL defines the role `editor`
// (and only that), so membership role validation can be exercised against a real schema.

const addIDP = (configuration: unknown) => ({
	query: GQL`mutation($configuration: Json!) {
		addIDP(identityProvider: "oidc", type: "mock", configuration: $configuration) {
			ok
			error { code }
		}
	}`,
	variables: { configuration },
})

const expectInvalidConfiguration = async (configuration: unknown) =>
	executeTenantTest({
		query: addIDP(configuration),
		executes: [...sqlTransaction()],
		return: {
			data: { addIDP: { ok: false, error: { code: 'INVALID_CONFIGURATION' } } },
		},
	})

test('addIDP rejects a claimMapping that still grants global roles (grantRoles was removed)', async () => {
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{ claim: 'groups', contains: 'Admins', grantRoles: ['project_admin'] }],
		},
	})
})

test('addIDP rejects a claimMapping granting a membership role not defined in the project ACL schema', async () => {
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			// the harness schema defines only `editor`; `salesperson` is unknown → rejected
			rules: [{ claim: 'department', equals: 'Sales', grantMembership: { project: 'crm', role: 'salesperson' } }],
		},
	})
})

test('addIDP rejects a malformed claimMapping (a rule with no claim)', async () => {
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{ contains: 'x', grantMembership: { project: 'demo', role: 'editor' } }],
		},
	})
})

test('addIDP accepts a claimMapping whose membership role IS defined in the project ACL schema (validation passes; fails later at the existence check)', async () => {
	// A valid mapping (role `editor` exists) passes claim-mapping validation, so the flow proceeds to
	// the slug existence check. We make that report ALREADY_EXISTS — which proves validation did not
	// reject the valid mapping — without needing the create-IDP SQL.
	await executeTenantTest({
		query: addIDP({
			externalIdentifier: 'sub',
			claimMapping: {
				rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }],
			},
		}),
		executes: [
			...sqlTransaction(
				{
					sql:
						'select "id", "slug", "type", "configuration", "disabled_at" as "disabledAt", "auto_sign_up" as "autoSignUp", "exclusive", "init_returns_config" as "initReturnsConfig", "require_verified_email" as "requireVerifiedEmail", "assume_email_verified" as "assumeEmailVerified"  from "tenant"."identity_provider"  where "slug" = ?',
					parameters: ['oidc'],
					response: { rows: [{ id: '123', slug: 'oidc' }] },
				},
			),
		],
		return: {
			data: { addIDP: { ok: false, error: { code: 'ALREADY_EXISTS' } } },
		},
	})
})

test("addIDP rejects a rule with a typo'd match key (equal instead of equals) — noExtraProps", async () => {
	// `equal` (typo for `equals`) is an unknown rule key. Without noExtraProps it was silently stripped,
	// leaving a rule with neither equals nor contains — which match-everyone (mere presence of the claim).
	// noExtraProps rejects the typo at config time instead.
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{ claim: 'groups', equal: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }],
		},
	})
})

test('addIDP rejects a rule with a misspelled grantMembership — noExtraProps', async () => {
	// A misspelled `grantMembership` (here `grantMembershp`) used to be silently stripped, leaving a
	// matches-but-grants-nothing rule; noExtraProps now rejects the unknown key outright.
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{ claim: 'groups', contains: 'Editorial', grantMembershp: { project: 'demo', role: 'editor' } }],
		},
	})
})

test('addIDP rejects an unknown key on a granted membership — noExtraProps', async () => {
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{ claim: 'groups', contains: 'Editorial', grantMembership: { project: 'demo', role: 'editor', extra: true } }],
		},
	})
})

test('addIDP rejects an unknown key on a membership variable / its from source — noExtraProps', async () => {
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{
				claim: 'groups',
				contains: 'Editorial',
				grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'language', value: ['x'] }] },
			}],
		},
	})
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{
				claim: 'groups',
				contains: 'Editorial',
				grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'language', from: { claim: 'langs', splt: ',' } }] },
			}],
		},
	})
})

test('addIDP rejects a claimMapping membership variable not defined for the role', async () => {
	// The harness `editor` role defines variables `language` / `siteFilter`; an unknown name is rejected
	// at config time (mirroring the MembershipValidator on the direct add-member path) rather than
	// silently writing a dead variable row at sign-in.
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{
				claim: 'department',
				equals: 'Editorial',
				grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'nonexistent', values: ['x'] }] },
			}],
		},
	})
})

test('addIDP rejects a claim-derived condition variable without an allow allowlist (ACL-condition injection guard)', async () => {
	// `siteFilter` is a condition variable: its stored value is parsed as a row-level ACL condition at
	// every content request, so a claim-derived value with no `allow` allowlist would let whoever
	// controls the claim inject the row filter. Must be rejected at config time.
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{
				claim: 'department',
				equals: 'Editorial',
				grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'siteFilter', from: { claim: 'filter' } }] },
			}],
		},
	})
})

test('addIDP rejects a passthrough claim-derived condition variable even with an allow allowlist', async () => {
	// `passthrough` writes the raw claim verbatim, so it is forbidden on a condition variable regardless
	// of `allow` (the allowlist still cannot make a verbatim claim a safe ACL expression).
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{
				claim: 'department',
				equals: 'Editorial',
				grantMembership: {
					project: 'demo',
					role: 'editor',
					variables: [{ name: 'siteFilter', from: { claim: 'filter' }, passthrough: true, allow: ['{"always":true}'] }],
				},
			}],
		},
	})
})

test('addIDP rejects a membership role that names a prototype member (own-property role check)', async () => {
	// A role name like `toString` / `constructor` must not resolve to an inherited Object.prototype
	// member and pass the existence check.
	for (const role of ['toString', 'constructor', 'hasOwnProperty']) {
		await expectInvalidConfiguration({
			externalIdentifier: 'sub',
			claimMapping: { rules: [{ claim: 'x', equals: 'y', grantMembership: { project: 'demo', role } }] },
		})
	}
})

test('addIDP accepts a condition variable bounded by an allow allowlist plus a valid entity variable', async () => {
	// Proves the condition-variable guard does NOT over-reject: a claim-derived condition value bounded
	// by `allow` (no passthrough) and a constant entity variable are both valid, so the flow proceeds to
	// the existence check (reported ALREADY_EXISTS).
	await executeTenantTest({
		query: addIDP({
			externalIdentifier: 'sub',
			claimMapping: {
				rules: [{
					claim: 'department',
					equals: 'Editorial',
					grantMembership: {
						project: 'demo',
						role: 'editor',
						variables: [
							{ name: 'siteFilter', from: { claim: 'filter' }, allow: ['{"eq":"site-1"}'] },
							{ name: 'language', values: ['uuid-en'] },
						],
					},
				}],
			},
		}),
		executes: [
			...sqlTransaction(
				{
					sql:
						'select "id", "slug", "type", "configuration", "disabled_at" as "disabledAt", "auto_sign_up" as "autoSignUp", "exclusive", "init_returns_config" as "initReturnsConfig", "require_verified_email" as "requireVerifiedEmail", "assume_email_verified" as "assumeEmailVerified"  from "tenant"."identity_provider"  where "slug" = ?',
					parameters: ['oidc'],
					response: { rows: [{ id: '123', slug: 'oidc' }] },
				},
			),
		],
		return: {
			data: { addIDP: { ok: false, error: { code: 'ALREADY_EXISTS' } } },
		},
	})
})

test('addIDP rejects a condition variable whose constant value is not a valid condition', async () => {
	// `siteFilter` is a condition variable: its stored value is parsed as a row-level ACL condition at
	// every content request (MembershipResolver does `conditionSchema()(JSON.parse(value))`). A constant
	// value that is not a parseable condition must be rejected at config time rather than silently denying
	// (`{ never: true }`) on every content request once granted.
	await expectInvalidConfiguration({
		externalIdentifier: 'sub',
		claimMapping: {
			rules: [{
				claim: 'department',
				equals: 'Editorial',
				grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'siteFilter', values: ['not-a-condition'] }] },
			}],
		},
	})
})

test('addIDP accepts a condition variable whose constant value IS a valid condition', async () => {
	// A constant condition value that parses as a real condition is allowed (proves the new JSON check does
	// not over-reject) — the flow proceeds to the existence check (reported ALREADY_EXISTS).
	await executeTenantTest({
		query: addIDP({
			externalIdentifier: 'sub',
			claimMapping: {
				rules: [{
					claim: 'department',
					equals: 'Editorial',
					grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'siteFilter', values: ['{"eq":"published"}'] }] },
				}],
			},
		}),
		executes: [
			...sqlTransaction(
				{
					sql:
						'select "id", "slug", "type", "configuration", "disabled_at" as "disabledAt", "auto_sign_up" as "autoSignUp", "exclusive", "init_returns_config" as "initReturnsConfig", "require_verified_email" as "requireVerifiedEmail", "assume_email_verified" as "assumeEmailVerified"  from "tenant"."identity_provider"  where "slug" = ?',
					parameters: ['oidc'],
					response: { rows: [{ id: '123', slug: 'oidc' }] },
				},
			),
		],
		return: {
			data: { addIDP: { ok: false, error: { code: 'ALREADY_EXISTS' } } },
		},
	})
})

test('updateIDP runs the same claimMapping validation (rejects a merged-in grantRoles)', async () => {
	// updateIDP is the more dangerous path — it mutates an already-trusted provider — and validates the
	// MERGED configuration. A merge that introduces a removed `grantRoles` must be rejected before any
	// UpdateIdpCommand SQL. The provider is fetched once outside the transaction (the audit `before`
	// snapshot) and once inside it; validation then fails, so only the two selects run.
	const idpRow = {
		id: '123',
		slug: 'mock',
		type: 'mock',
		configuration: { externalIdentifier: 'sub' },
		disabledAt: null,
		autoSignUp: false,
		exclusive: false,
		initReturnsConfig: false,
		requireVerifiedEmail: false,
		assumeEmailVerified: false,
	}
	const selectIdp = {
		sql:
			'select "id", "slug", "type", "configuration", "disabled_at" as "disabledAt", "auto_sign_up" as "autoSignUp", "exclusive", "init_returns_config" as "initReturnsConfig", "require_verified_email" as "requireVerifiedEmail", "assume_email_verified" as "assumeEmailVerified"  from "tenant"."identity_provider"  where "slug" = ?',
		parameters: ['mock'],
		response: { rows: [idpRow] },
	}
	await executeTenantTest({
		query: {
			query: GQL`mutation($configuration: Json!) {
				updateIDP(identityProvider: "mock", configuration: $configuration, mergeConfiguration: true) {
					ok
					error { code }
				}
			}`,
			variables: {
				configuration: { claimMapping: { rules: [{ claim: 'groups', contains: 'Admins', grantRoles: ['project_admin'] }] } },
			},
		},
		executes: [
			selectIdp,
			...sqlTransaction(selectIdp),
		],
		return: {
			data: { updateIDP: { ok: false, error: { code: 'INVALID_CONFIGURATION' } } },
		},
	})
})
