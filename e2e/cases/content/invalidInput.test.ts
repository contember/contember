import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
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

test('invalid date filter in a query is an input error', async () => {
	const tester = await createTester(createSchema(PostModel))

	await tester(gql`
        mutation {
            createPost(data: {slug: "foo", createdAt: "2020-10-30T00:00:00+01:00"}) {
                ok
            }
        }`)
		.expect(200)

	// a fractional offset, as some browsers report for historical local time
	await tester(gql`
        query {
            paginatePost(filter: { createdAt: { gte: "0020-10-30T00:00:00+00:57.733333333333334" } }) {
                pageInfo {
                    totalCount
                }
            }
        }
	`)
		.expect(400)
		.expect({
			data: null,
			errors: [{
				message: 'invalid input syntax for type timestamp with time zone: "0020-10-30T00:00:00+00:57.733333333333334"',
				path: [],
			}],
		})

	await tester(gql`
        query {
            paginatePost(filter: { createdAt: { gte: "2020-10-29T00:00:00+00:00" } }) {
                pageInfo {
                    totalCount
                }
            }
        }
	`)
		.expect(200)
		.expect({ data: { paginatePost: { pageInfo: { totalCount: 1 } } } })
})
