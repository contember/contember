import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'vitest'
import { createTester, gql } from '../../src/tester'
namespace PostModel {
	export class Post {
		slug = def.stringColumn().unique()
		createdAt = def.dateTimeColumn()
	}
}

test('invalid date input', async () => {
	const tester = await createTester(createSchema(PostModel))

	await tester(gql`
        mutation {
            createPost(data: {slug: "foo"}) {
                ok
            }
        }`)
		.expect(200)

	await tester(gql`
        mutation {
            updatePost(by: { slug: "foo" }, data: { createdAt: "2020-13-01 20:00" }) {
                ok
                errors {
                    type
                    message
                }
            }
        }
	`)
		.expect(200)
		.expect({
			data: {
				updatePost: {
					ok: false,
					errors: [{ type: 'InvalidDataInput', message: 'date/time field value out of range: "2020-13-01 20:00"' }],
				},
			},
		})

})

