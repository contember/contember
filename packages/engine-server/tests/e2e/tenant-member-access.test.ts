import { assert, test } from 'vitest'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../src/tester.js'
import { addProjectMember, signIn, signUp } from '../src/requests.js'


namespace TagModel {
	export class Tag {
		label = def.stringColumn()
	}
}


test('Tenant API: sign up, add to a project and check project access', async () => {
	const tester = await createTester(createSchema(TagModel))

	const email = `john+${Date.now()}@doe.com`
	const identityId = await signUp(email)
	const authKey = await signIn(email)

	await tester(
		gql`
			query {
				listTag {
					id
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(404)
		.expect({ errors: [{ message: `Project ${tester.projectSlug} NOT found`, code: 404 }] })


	await addProjectMember(identityId, tester.projectSlug)

	await tester(
		gql`
			query {
				listTag {
					id
				}
			}
		`,
		{ authorizationToken: authKey },
	)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, { listTag: [] })
		})
		.expect(200)
})
