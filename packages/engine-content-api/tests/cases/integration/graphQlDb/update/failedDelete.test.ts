import { test } from 'vitest'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'
import { executeDbTest } from '@contember/engine-api-tester'

test('fails when deleting entity without proper cascade', async () => {
	await executeDbTest({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.column('slug').unique(['slug']),
			)
			.entity('PostLocales', entity =>
				entity.manyHasOne('post', relation => relation.target('Post').inversedBy('locales')).column('title'),
			)
			.buildSchema(),
		seed: [
			{
				query: `mutation {
					createPost(data: {slug: "foo", locales: [{create: {title: "bar"}}]}) {
						ok
						node {
							id
						}
					}
				}`,
			},
		],
		query: GQL`
        mutation {
          deletePost(by: {slug: "foo"}) {
          	errorMessage
            node {
              id
            }
          }
        }`,
		return: {
			deletePost: {
				errorMessage: 'Execution has failed:\nunknown field: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000001 row(s) of entity Post, because it is still referenced from 123e4567-e89b-12d3-a456-000000000002 row(s) of entity PostLocales in relation post. OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".)',
				node: null,
			},
		},
	})
})


