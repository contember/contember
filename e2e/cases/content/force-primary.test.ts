import { expect, test } from 'bun:test'
import supertest from 'supertest'
import { c, createSchema } from '@contember/schema-definition'
import { apiUrl, createTester, gql } from '../../src/tester.js'

namespace PrimaryReadModel {
	export class Article {
		title = c.stringColumn()
	}
}

test('Content API accepts forced primary reads and exposes the mutation marker through CORS', async () => {
	const tester = await createTester(createSchema(PrimaryReadModel))
	const mutation = await tester(gql`
		mutation {
			createArticle(data: { title: "Fresh" }) { ok }
		}
	`).set('Origin', 'https://admin.example.com').expect(200)
	expect(mutation.body.data).toEqual({ createArticle: { ok: true } })
	// The e2e engine has no read replica, so mutations are not marked; the engine-http unit test covers the marker.
	expect(mutation.get('X-Contember-Mutation')).toBeUndefined()
	expect(mutation.get('Access-Control-Expose-Headers')?.toLowerCase()).toContain('x-contember-mutation')

	const query = await tester(gql`
		query {
			listArticle { title }
		}
	`).set('X-Contember-Force-Primary', '1').expect(200)
	expect(query.body.data).toEqual({ listArticle: [{ title: 'Fresh' }] })
	expect(query.get('X-Contember-Mutation')).toBeUndefined()

	const preflight = await supertest(apiUrl)
		.options(`/content/${tester.projectSlug}/live`)
		.set('Origin', 'https://admin.example.com')
		.set('Access-Control-Request-Method', 'POST')
		.set('Access-Control-Request-Headers', 'content-type,authorization,x-contember-force-primary')
		.expect(204)
	expect(preflight.get('Access-Control-Allow-Headers')).toContain('x-contember-force-primary')
})
