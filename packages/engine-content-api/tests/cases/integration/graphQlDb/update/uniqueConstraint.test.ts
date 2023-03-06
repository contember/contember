import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { test } from 'vitest'
import { executeDbTest } from '@contember/engine-api-tester'
import { GQL } from '../../../../src/tags'

const model = new SchemaBuilder()
	.entity('Site', e =>
		e.column('slug', c => c.unique().type(Model.ColumnType.String)),
	)
	.buildSchema()

test('fail when creating a non-unique site', async () => {
	await executeDbTest({
		schema: { model },
		seed: [
			{
				query: GQL`mutation {
                createSite(data: {slug: "en"}) {
                  ok
                }
              }`,
			},
		],
		query: GQL`mutation {
                createSite(data: {slug: "en"}) {
                  ok
                  errorMessage
                }
              }`,
		return: {
			createSite: {
				ok: false,
				errorMessage: 'Execution has failed:\nslug: UniqueConstraintViolation (Value (en) already exists in unique columns (slug) on entity Site)',
			},
		},
	})
})


