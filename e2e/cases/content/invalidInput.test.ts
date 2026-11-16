import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'
namespace PostModel {
	export class Post {
		slug = def.stringColumn().unique()
		createdAt = def.dateTimeColumn()
	}
}

namespace EventModel {
	export class Event {
		name = def.stringColumn().unique()
		startDate = def.dateColumn()
		startsAt = def.dateTimeColumn()
		startTime = def.timeColumn()
		price = def.numericColumn(10, 2)
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
            updatePost(by: { slug: "foo" }, data: { createdAt: "2020-12-01 25:00" }) {
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
					errors: [{ type: 'InvalidDataInput', message: 'date/time field value out of range: "2020-12-01 25:00"' }],
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

const errorMessages = (body: { errors?: { message: string }[] }) => body.errors?.map(it => it.message)

test('impossible date in a filter is an input error', async () => {
	const tester = await createTester(createSchema(EventModel))

	await tester(gql`
        mutation {
            createEvent(data: { name: "foo", startDate: "2026-02-28", startsAt: "2026-02-28T10:00:00Z" }) {
                ok
            }
        }`)
		.expect(200)
		.expect({ data: { createEvent: { ok: true } } })

	await tester(gql`
        query {
            listEvent(filter: { startDate: { gte: "2026-02-30" } }) {
                name
            }
        }
	`)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Value is not a valid date: 2026-02-30'])
		})

	await tester(
		gql`
        query($date: Date!) {
            listEvent(filter: { startDate: { gte: $date } }) {
                name
            }
        }
	`,
		{ variables: { date: '0000-02-02' } },
	)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Variable "$date" got invalid value "0000-02-02"; Value is not a valid date: 0000-02-02'])
		})

	await tester(gql`
        query {
            listEvent(filter: { startsAt: { lt: "2026-02-30T00:00:00Z" } }) {
                name
            }
        }
	`)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Value is not a valid date: 2026-02-30T00:00:00Z'])
		})

	await tester(
		gql`
        query($date: Date!) {
            listEvent(filter: { startDate: { gte: $date } }) {
                name
            }
        }
	`,
		{ variables: { date: '2026-02-28' } },
	)
		.expect(200)
		.expect({ data: { listEvent: [{ name: 'foo' }] } })
})

test('impossible date in create and update input is an input error', async () => {
	const tester = await createTester(createSchema(EventModel))

	await tester(gql`
        mutation {
            createEvent(data: { name: "foo", startDate: "2026-02-30" }) {
                ok
            }
        }`)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Value is not a valid date: 2026-02-30'])
		})

	await tester(gql`
        mutation {
            createEvent(data: { name: "foo", startDate: "2024-02-29" }) {
                ok
            }
        }`)
		.expect(200)
		.expect({ data: { createEvent: { ok: true } } })

	await tester(
		gql`
        mutation($date: Date!) {
            updateEvent(by: { name: "foo" }, data: { startDate: $date }) {
                ok
            }
        }`,
		{ variables: { date: '0000-02-02' } },
	)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Variable "$date" got invalid value "0000-02-02"; Value is not a valid date: 0000-02-02'])
		})

	await tester(gql`
        query {
            listEvent(filter: { startDate: { eq: "2024-02-29" } }) {
                name
            }
        }`)
		.expect(200)
		.expect({ data: { listEvent: [{ name: 'foo' }] } })
})

test('invalid Time and Decimal variables are input errors', async () => {
	const tester = await createTester(createSchema(EventModel))

	await tester(
		gql`
        query($time: Time!) {
            listEvent(filter: { startTime: { gte: $time } }) {
                name
            }
        }
	`,
		{ variables: { time: '25:00' } },
	)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Variable "$time" got invalid value "25:00"; Value is not a valid time: 25:00'])
		})

	await tester(
		gql`
        mutation($price: Decimal!) {
            createEvent(data: { name: "foo", price: $price }) {
                ok
            }
        }`,
		{ variables: { price: 'abc' } },
	)
		.expect(400)
		.expect(response => {
			expect(errorMessages(response.body)).toEqual(['Variable "$price" got invalid value "abc"; Value is not a valid decimal: abc'])
		})
})
