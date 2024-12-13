import { test } from 'bun:test'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester'

namespace Model {
	@def.Unique('url')
	export class Url {
		url = def.stringColumn().notNull()
		redirect: def.OneHasOneDefinition = def.oneHasOne(Redirect, 'url').setNullOnDelete().removeOrphan()
	}

	export class Redirect {
		url = def.oneHasOneInverse(Url, 'redirect').notNull()

		internalUrl = def.manyHasOne(Url)
	}
}
test('create redirect to non-existing target', async () => {
	const tester = await createTester(createSchema(Model))

	await tester(gql`
		mutation {
  createRedirect(
    data: {
      internalUrl: {connect: {url: "abcd"}},
      url: {create: {url: "xyz"}}
    }
  ) {
    ok
    errorMessage
  }
}
		`)
		.expect(200)
		.expect({
			data: {
				createRedirect: {
					ok: false,
					errorMessage: 'Execution has failed:\ninternalUrl: NotFoundOrDenied (for input {"url":"abcd"})',
				},
			},
		})
})


