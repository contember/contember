import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { CredentialsProvider, GraphQlClient } from '@contember/graphql-client'
import { apiUrl, createTester, rand } from '../../src/tester.js'
import { applyTrust, checkToken, disableTrust, expectInvalidToken, startTestIssuer } from '../../src/workloadIdentity.js'

namespace ArticleModel {
	export const readerRole = acl.createRole('reader')

	@acl.allow(readerRole, { read: true })
	export class Article {
		title = def.stringColumn()
	}
}

const listArticles = `query { listArticle { id } }`

test('workload identity: a requireDpop trust accepts a bound token only with a fresh proof', async () => {
	const tester = await createTester(createSchema(ArticleModel))
	const { issuer, jwksUri, mintToken } = await startTestIssuer()
	const slug = `e2e-${rand()}`
	const audience = `contember:e2e:${slug}`
	const subject = `backend-${rand()}`
	const path = `/content/${tester.projectSlug}/live`
	const url = apiUrl + path
	try {
		await applyTrust(slug, {
			profile: 'oidc',
			issuer: issuer.issuer,
			audience,
			jwksUri,
			conditions: [{ claim: 'sub', equals: subject }],
			requireDpop: true,
			memberships: [{ project: tester.projectSlug, role: 'reader' }],
		})

		const credentials = issuer.credentials({ subject, audience, dpop: true })
		// the client retries a 401 with a refreshed token, which would hide a rejected first attempt
		const refreshes: boolean[] = []
		const recordingCredentials: CredentialsProvider = {
			authenticate: request => {
				refreshes.push(request.refresh)
				return credentials.authenticate(request)
			},
		}
		const client = new GraphQlClient({ url, credentials: recordingCredentials })
		expect(await client.execute<{ listArticle: { id: string }[] }>(listArticles)).toStrictEqual({ listArticle: [] })
		expect(refreshes).toStrictEqual([false])

		const headers = await credentials.authenticate({ url, method: 'POST', refresh: false })
		const [scheme, token] = headers.Authorization.split(' ')
		expect(scheme).toBe('DPoP')
		expect(await checkToken(token)).toMatchObject({ ok: true, requiresDpop: true })

		// no downgrade: the bound token alone, with or without its proof, is not a bearer token
		expectInvalidToken(await supertest(apiUrl).post(path).set('Authorization', `Bearer ${token}`).send({ query: listArticles }))
		expectInvalidToken(
			await supertest(apiUrl).post(path).set('Authorization', `Bearer ${token}`).set('DPoP', headers.DPoP).send({ query: listArticles }),
		)

		const withProof = () =>
			supertest(apiUrl).post(path).set('Authorization', headers.Authorization).set('DPoP', headers.DPoP).send({ query: listArticles })
		const first = await withProof()
		expect({ status: first.status, body: first.body }).toStrictEqual({ status: 200, body: { data: { listArticle: [] } } })
		expectInvalidToken(await withProof(), 'DPoP')

		const withoutProof = await supertest(apiUrl).post(path).set('Authorization', headers.Authorization).send({ query: listArticles })
		expectInvalidToken(withoutProof, 'DPoP')

		// requireDpop also rejects an unbound token from the right principal
		expectInvalidToken(await tester(listArticles, { authorizationToken: await mintToken({ sub: subject, aud: audience }) }))
	} finally {
		await disableTrust(slug)
		await issuer.close()
	}
})
