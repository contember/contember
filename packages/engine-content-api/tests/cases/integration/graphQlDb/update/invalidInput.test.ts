import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { test, assert } from 'vitest'
import { executeDbTest } from '@contember/engine-api-tester'
import { GQL } from '../../../../src/tags'

const model = new SchemaBuilder()
	.entity('Post', e =>
		e
			.column('slug', c => c.type(Model.ColumnType.String).unique())
			.column('createdAt', c => c.type(Model.ColumnType.DateTime)),
	)
	.buildSchema()
test('returns error for invalid date input', async () => {
	await executeDbTest({
		schema: { model },
		seed: [
			{
				query: GQL`mutation {
							createPost(data: {slug: "foo"}) {
								ok
							}
						}`,
			},
		],
		query: GQL`mutation {
            updatePost(by: { slug: "foo" }, data: { createdAt: "2020-13-01 20:00" }) {
              ok
              errors {
              	type
	            message
              }
            }
          }`,
		return: {
			updatePost: {
				ok: false,
				errors: [{ type: 'InvalidDataInput', message: 'date/time field value out of range: "2020-13-01 20:00"' }],
			},
		},
		expectDatabase: {},
	})
})
