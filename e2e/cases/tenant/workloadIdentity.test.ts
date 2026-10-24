import { expect, test } from 'bun:test'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, executeGraphql, rand } from '../../src/tester.js'
import {
	applyTrust,
	applyTrustRequest,
	checkToken,
	disableTrust,
	disableTrustRequest,
	expectInvalidToken,
	nowSeconds,
	sleep,
	startTestIssuer,
} from '../../src/workloadIdentity.js'

namespace ArticleModel {
	export const readerRole = acl.createRole('reader')
	export const writerRole = acl.createRole('writer')

	@acl.allow(readerRole, { read: true })
	@acl.allow(writerRole, { read: true, create: true })
	export class Article {
		title = def.stringColumn()
	}
}

const listArticles = `query { listArticle { id } }`

const meQuery = `query { me { id kind } }`

const authLogQuery = `query($filter: AuthLogFilter) {
	authLog(filter: $filter, limit: 50) {
		entries { type success workloadIdentityTrustId }
	}
}`

const addProjectMemberMutation = `mutation($projectSlug: String!, $identityId: String!, $memberships: [MembershipInput!]!) {
	addProjectMember(projectSlug: $projectSlug, identityId: $identityId, memberships: $memberships) { ok error { code } }
}`

const fetchSuccessRows = async (identityId: string) => {
	const response = await executeGraphql('/tenant', authLogQuery, {
		variables: { filter: { types: ['workload_auth_success'], invokedByIdentityId: identityId } },
	})
	expect(response.status).toBe(200)
	return response.body.data.authLog.entries
}

/** The success row is written detached from the request, so wait until it lands. */
const waitForSuccessRows = async (identityId: string, count: number) => {
	for (let attempt = 0; attempt < 50; attempt++) {
		const rows = await fetchSuccessRows(identityId)
		if (rows.length >= count) {
			return rows
		}
		await sleep(100)
	}
	return await fetchSuccessRows(identityId)
}

/** The earliest `iat` the trust still accepts: `tokens_valid_after` minus the 30 s clock tolerance, in whole seconds. */
const earliestAcceptedIat = (tokensValidAfter: string) => Math.floor(Date.parse(tokensValidAfter) / 1000) + 1 - 30

test('workload identity: a minted token authenticates against the content and tenant APIs and is logged once', async () => {
	const tester = await createTester(createSchema(ArticleModel))
	const { issuer, jwksUri, mintToken } = await startTestIssuer()
	const slug = `e2e-${rand()}`
	const audience = `contember:e2e:${slug}`
	const subject = `backend-${rand()}`
	try {
		const applied = await applyTrust(slug, {
			profile: 'oidc',
			issuer: issuer.issuer,
			audience,
			jwksUri,
			conditions: [{ claim: 'sub', equals: subject }],
			memberships: [{ project: tester.projectSlug, role: 'reader' }],
		})
		expect(applied).toMatchObject({ created: true, trust: { slug, disabled: false, identity: { kind: 'WORKLOAD' } } })
		const identityId = applied.trust.identity.id

		const token = await mintToken({ sub: subject, aud: audience })
		await tester(listArticles, { authorizationToken: token })
			.expect(200)
			.expect({ data: { listArticle: [] } })
		await tester(listArticles, { authorizationToken: token })
			.expect(200)
		const me = await executeGraphql('/tenant', meQuery, { authorizationToken: token })
		expect(me.status).toBe(200)
		expect(me.body.data).toStrictEqual({ me: { id: identityId, kind: 'WORKLOAD' } })

		expect(await waitForSuccessRows(identityId, 1)).toStrictEqual([
			{ type: 'workload_auth_success', success: true, workloadIdentityTrustId: applied.trust.id },
		])

		// a second token is a second row: deduplication is per token, not per trust
		const secondToken = await mintToken({ sub: subject, aud: audience })
		await tester(listArticles, { authorizationToken: secondToken })
			.expect(200)
		expect(await waitForSuccessRows(identityId, 2)).toHaveLength(2)
		await sleep(300)
		expect(await fetchSuccessRows(identityId)).toHaveLength(2)
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
})

test('workload identity: every rejected token gets the same 401', async () => {
	const tester = await createTester(createSchema(ArticleModel))
	const { issuer, jwksUri, mintToken } = await startTestIssuer()
	const slug = `e2e-${rand()}`
	const audience = `contember:e2e:${slug}`
	const subject = `backend-${rand()}`
	try {
		await applyTrust(slug, {
			profile: 'oidc',
			issuer: issuer.issuer,
			audience,
			jwksUri,
			conditions: [{ claim: 'sub', equals: subject }],
			memberships: [{ project: tester.projectSlug, role: 'reader' }],
		})
		const now = nowSeconds()
		const rejected = [
			{ step: 'trust_not_found', token: await mintToken({ sub: subject, aud: `${audience}:unknown` }) },
			{ step: 'condition', token: await mintToken({ sub: `${subject}-other`, aud: audience }) },
			{ step: 'lifetime', token: await mintToken({ sub: subject, aud: audience, iat: now - 120, exp: now - 60 }) },
			{
				step: 'signature',
				token: await issuer.mint({ iss: issuer.issuer, sub: subject, aud: audience, iat: now, exp: now + 300 }, { foreignKey: true }),
			},
			{
				step: 'typ',
				token: await issuer.mint({ iss: issuer.issuer, sub: subject, aud: audience, iat: now, exp: now + 300 }, { header: { typ: 'at+jwt' } }),
			},
		]
		for (const { step, token } of rejected) {
			// the diagnostic proves each token fails for its own reason, not for a shared incidental one
			expect({ step, check: await checkToken(token) }).toMatchObject({ step, check: { ok: false, failure: { step } } })
			expectInvalidToken(await tester(listArticles, { authorizationToken: token }))
			expectInvalidToken(await executeGraphql('/tenant', meQuery, { authorizationToken: token }))
		}

		await tester(listArticles, { authorizationToken: await mintToken({ sub: subject, aud: audience }) })
			.expect(200)
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
})

test('workload identity: tokens_valid_after rejects earlier tokens on a principal change and on re-enable, not on a grant change', async () => {
	const tester = await createTester(createSchema(ArticleModel))
	const { issuer, jwksUri, mintToken } = await startTestIssuer()
	const slug = `e2e-${rand()}`
	const audience = `contember:e2e:${slug}`
	const subject = `backend-${rand()}`
	const definition = {
		profile: 'oidc',
		issuer: issuer.issuer,
		audience,
		jwksUri,
		conditions: [{ claim: 'sub', equals: subject }],
		memberships: [{ project: tester.projectSlug, role: 'reader' }],
	}
	// minted with the earliest `iat` the current boundary accepts, so it falls behind any later boundary
	const mintBoundaryToken = (tokensValidAfter: string) => {
		const iat = earliestAcceptedIat(tokensValidAfter)
		return mintToken({ sub: subject, aud: audience, iat, exp: iat + 600 })
	}
	const waitPastBoundary = async (tokensValidAfter: string) => {
		const boundary = earliestAcceptedIat(tokensValidAfter) + 30
		await sleep(Math.max(0, boundary * 1000 - Date.now()) + 200)
	}
	try {
		const created = await applyTrust(slug, definition)
		const earlyToken = await mintBoundaryToken(created.trust.tokensValidAfter)
		await tester(listArticles, { authorizationToken: earlyToken })
			.expect(200)

		const grantChange = await applyTrust(slug, {
			...definition,
			memberships: [{ project: tester.projectSlug, role: 'reader' }, { project: tester.projectSlug, role: 'writer' }],
		})
		expect(grantChange).toMatchObject({ created: false, tokensValidAfterBumped: false, trust: { tokensValidAfter: created.trust.tokensValidAfter } })
		await tester(`mutation { createArticle(data: { title: "granted" }) { ok } }`, { authorizationToken: earlyToken })
			.expect(200)
			.expect({ data: { createArticle: { ok: true } } })

		await waitPastBoundary(created.trust.tokensValidAfter)
		const principalChange = await applyTrust(slug, {
			...definition,
			conditions: [{ claim: 'sub', in: [subject, `${subject}-next`] }],
		})
		expect(principalChange).toMatchObject({ created: false, tokensValidAfterBumped: true })
		expect(earliestAcceptedIat(principalChange.trust.tokensValidAfter)).toBeGreaterThan(earliestAcceptedIat(created.trust.tokensValidAfter))
		expect(await checkToken(earlyToken)).toMatchObject({ ok: false, failure: { step: 'tokens_valid_after' } })
		expectInvalidToken(await tester(listArticles, { authorizationToken: earlyToken }))
		await tester(listArticles, { authorizationToken: await mintToken({ sub: subject, aud: audience }) })
			.expect(200)

		const beforeDisableToken = await mintBoundaryToken(principalChange.trust.tokensValidAfter)
		await tester(listArticles, { authorizationToken: beforeDisableToken })
			.expect(200)
		await disableTrust(slug)
		expectInvalidToken(await tester(listArticles, { authorizationToken: beforeDisableToken }))
		expectInvalidToken(await tester(listArticles, { authorizationToken: await mintToken({ sub: subject, aud: audience }) }))

		await waitPastBoundary(principalChange.trust.tokensValidAfter)
		const reenabled = await applyTrust(slug, { ...definition, conditions: [{ claim: 'sub', in: [subject, `${subject}-next`] }], disabled: false })
		expect(reenabled).toMatchObject({ created: false, tokensValidAfterBumped: true, trust: { disabled: false } })
		expect(await checkToken(beforeDisableToken)).toMatchObject({ ok: false, failure: { step: 'tokens_valid_after' } })
		expectInvalidToken(await tester(listArticles, { authorizationToken: beforeDisableToken }))
		await tester(listArticles, { authorizationToken: await mintToken({ sub: subject, aud: audience }) })
			.expect(200)
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
}, 15_000)

test('workload identity: no side channel to the trust identity and no trust management with a workload credential', async () => {
	const tester = await createTester(createSchema(ArticleModel))
	const { issuer, jwksUri, mintToken } = await startTestIssuer()
	const slug = `e2e-${rand()}`
	const audience = `contember:e2e:${slug}`
	const subject = `backend-${rand()}`
	const definition = {
		profile: 'oidc',
		issuer: issuer.issuer,
		audience,
		jwksUri,
		conditions: [{ claim: 'sub', equals: subject }],
		memberships: [{ project: tester.projectSlug, role: 'reader' }],
	}
	try {
		const applied = await applyTrust(slug, definition)

		const addMember = await executeGraphql('/tenant', addProjectMemberMutation, {
			variables: { projectSlug: tester.projectSlug, identityId: applied.trust.identity.id, memberships: [{ role: 'writer', variables: [] }] },
		})
		expect(addMember.body.data.addProjectMember).toStrictEqual({ ok: false, error: { code: 'WORKLOAD_IDENTITY_MANAGED' } })

		const workloadToken = await mintToken({ sub: subject, aud: audience })
		const otherSlug = `e2e-${rand()}`
		const applyWithWorkload = await applyTrustRequest(otherSlug, { ...definition, audience: `contember:e2e:${otherSlug}` }, workloadToken)
		expect(applyWithWorkload.status).toBe(200)
		expect(applyWithWorkload.body.data.applyWorkloadIdentityTrust).toMatchObject({ ok: false, error: { code: 'WORKLOAD_CREDENTIAL_FORBIDDEN' } })
		const disableWithWorkload = await disableTrustRequest(slug, workloadToken)
		expect(disableWithWorkload.body.data.disableWorkloadIdentityTrust).toStrictEqual({ ok: false, error: { code: 'WORKLOAD_CREDENTIAL_FORBIDDEN' } })

		// the refused disable left the trust working
		await tester(listArticles, { authorizationToken: workloadToken })
			.expect(200)
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
})

test('workload identity: checkWorkloadIdentityToken reports the failing condition with its index and the actual value', async () => {
	const tester = await createTester(createSchema(ArticleModel))
	const { issuer, jwksUri, mintToken } = await startTestIssuer()
	const slug = `e2e-${rand()}`
	const audience = `contember:e2e:${slug}`
	const subject = `backend-${rand()}`
	try {
		await applyTrust(slug, {
			profile: 'oidc',
			issuer: issuer.issuer,
			audience,
			jwksUri,
			conditions: [{ claim: 'env', equals: 'e2e' }, { claim: 'sub', equals: subject }],
			memberships: [{ project: tester.projectSlug, role: 'reader' }],
		})

		expect(await checkToken(await mintToken({ sub: 'someone-else', aud: audience, env: 'e2e' }))).toStrictEqual({
			ok: false,
			trust: { slug },
			failure: { step: 'condition', conditionIndex: 1, actualValue: 'someone-else' },
			requiresDpop: false,
		})
		expect(await checkToken(await mintToken({ sub: subject, aud: audience, env: 'e2e' }))).toStrictEqual({
			ok: true,
			trust: { slug },
			failure: null,
			requiresDpop: false,
		})
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
})
