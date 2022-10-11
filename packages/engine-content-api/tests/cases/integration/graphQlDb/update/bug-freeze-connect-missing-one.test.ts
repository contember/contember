import { test } from 'vitest'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { executeDbTest } from '@contember/engine-api-tester'

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
	await executeDbTest({
		schema: { model: def.createModel(Model) },
		query: GQL`
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
		`,
		seed: [],
		expectDatabase: {},
		return: {
			createRedirect: {
				ok: false,
				errorMessage: 'Execution has failed:\ninternalUrl: NotFoundOrDenied (for input {"url":"abcd"})',
			},
		},
	})
})


