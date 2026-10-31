import { expect, test } from 'bun:test'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql, rand } from '../../src/tester.js'
import { applyTrust, disableTrust, startTestIssuer } from '../../src/workloadIdentity.js'

namespace SiteModel {
	export const editorRole = acl.createRole('editor')
	export const siteVariable = acl.createConditionVariable('site', editorRole)

	@acl.allow(editorRole, { read: true, when: { site: siteVariable } })
	export class Article {
		site = def.stringColumn().notNull()
	}
}

const site = (name: string) => JSON.stringify({ eq: name })

const assume = (variables: { name: string; values: string[] }[]) => JSON.stringify({ memberships: [{ role: 'editor', variables }] })

const listArticles = gql`
	query {
		listArticle(orderBy: [{ site: asc }]) {
			site
		}
	}
`

test('workload identity: the trust envelope bounds assume-membership', async () => {
	const tester = await createTester(createSchema(SiteModel))
	await tester(
		gql`
			mutation {
				blog: createArticle(data: { site: "blog" }) { ok }
				shop: createArticle(data: { site: "shop" }) { ok }
				landing: createArticle(data: { site: "landing" }) { ok }
			}
		`,
	)
		.expect(200)
		.expect({ data: { blog: { ok: true }, shop: { ok: true }, landing: { ok: true } } })

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
			memberships: [{
				project: tester.projectSlug,
				role: 'editor',
				variables: [{ name: 'site', values: [site('blog'), site('shop')] }],
				assumeMembership: { editor: { variables: { site: 'site' } } },
			}],
		})
		const token = await mintToken({ sub: subject, aud: audience })

		await tester(listArticles, { authorizationToken: token })
			.expect(200)
			.expect({ data: { listArticle: [{ site: 'blog' }, { site: 'shop' }] } })

		await tester(listArticles, { authorizationToken: token })
			.set('X-Contember-Assume-Membership', assume([{ name: 'site', values: [site('blog')] }]))
			.expect(200)
			.expect({ data: { listArticle: [{ site: 'blog' }] } })

		const outside = await tester(listArticles, { authorizationToken: token })
			.set('X-Contember-Assume-Membership', assume([{ name: 'site', values: [site('landing')] }]))
		expect(outside.status).toBe(403)

		const widened = await tester(listArticles, { authorizationToken: token })
			.set('X-Contember-Assume-Membership', assume([{ name: 'site', values: [site('blog'), site('landing')] }]))
		expect(widened.status).toBe(403)

		// an omitted variable would otherwise fall back to the role's unbounded default
		const omitted = await tester(listArticles, { authorizationToken: token })
			.set('X-Contember-Assume-Membership', assume([]))
		expect(omitted.status).toBe(403)
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
})
