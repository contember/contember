import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester'

namespace Model {
	export class Site {
		slug = c.stringColumn().unique()
		contactPage = c.oneHasOne(ContactPage, 'site')
	}

	export class ContactPage {
		title = c.stringColumn()
		site = c.oneHasOneInverse(Site, 'contactPage').notNull()
	}
}

test('update site & create contact page', async () => {
	const tester = await createTester(createSchema(Model))

	await tester(gql`mutation {
        createSite(data: {slug: "en"}) {
            ok
        }
    }`)
		.expect(200)
		.expect({
			data: {
				createSite: {
					ok: true,
				},
			},
		})


	await tester(gql`mutation {
        updateSite(by: { slug: "en" }, data: { contactPage: { create: { title: "Test" } } }) {
            ok
        }
    }`)
		.expect(200)
		.expect({
			data: {
				updateSite: {
					ok: true,
				},
			},
		})

	await tester(gql`query {
		
		getSite(by: { slug: "en" }) {
			slug
			contactPage {
				title
            }
        }
    }`)
		.expect(200)
		.expect({
			data: {
				getSite: {
					slug: 'en',
					contactPage: {
						title: 'Test',
					},
				},
			},
		})

})

test('update site & try to create contact page which however exists', async () => {
	const tester = await createTester(createSchema(Model))
	await tester(gql`mutation {
        createSite(data: {slug: "en", contactPage: { create: { title: "Test" } } }) {
            ok
        }
    }`)
		.expect(200)
		.expect({
			data: {
				createSite: {
					ok: true,
				},
			},
		})

	await tester(gql`mutation {
        updateSite(by: { slug: "en" }, data: { contactPage: { create: { title: "Test 2" } } }) {
            ok
            errors {
                type
            }
        }
    }`)
		.expect(200)
		.expect({
			data: {
				updateSite: {
					ok: false,
					errors: [
						{
							type: 'NotNullConstraintViolation',
						},
					],
				},
			},
		})

	await tester(gql`query {

        getSite(by: { slug: "en" }) {
            slug
            contactPage {
                title
            }
        }
    }`)
		.expect(200)
		.expect({
			data: {
				getSite: {
					slug: 'en',
					contactPage: {
						title: 'Test',
					},
				},
			},
		})
})

