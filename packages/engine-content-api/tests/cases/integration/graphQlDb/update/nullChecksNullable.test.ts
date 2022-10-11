import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { test } from 'vitest'
import { executeDbTest } from '@contember/engine-api-tester'
import { GQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

const model = new SchemaBuilder()
	.entity('Site', e => e.column('slug', c => c.unique().type(Model.ColumnType.String)))
	.entity('ContactPage', e =>
		e.column('title').oneHasOne('site', r => r.target('Site').inversedBy('contactPage').notNull()),
	)
	.buildSchema()

test('update site & create contact page', async () => {
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
            updateSite(by: { slug: "en" }, data: { contactPage: { create: { title: "Test" } } }) {
              ok
            }
          }`,
		return: {
			updateSite: {
				ok: true,
			},
		},
		expectDatabase: {
			site: [{ id: testUuid(1), slug: 'en' }],
			contact_page: [{ site_id: testUuid(1), id: testUuid(2), title: 'Test' }],
		},
	})
})

test('update site & try to create contact page which however exists', async () => {
	await executeDbTest({
		schema: { model },
		seed: [
			{
				query: GQL`mutation {
                createSite(data: {slug: "en", contactPage: { create: { title: "Test" } } }) {
                  ok
                }
              }`,
			},
		],
		query: GQL`mutation {
            updateSite(by: { slug: "en" }, data: { contactPage: { create: { title: "Test 2" } } }) {
              ok
	            errors {
		            type
	            }
            }
          }`,
		return: {
			updateSite: {
				ok: false,
				errors: [
					{
						type: 'NotNullConstraintViolation',
					},
					{
						type: 'UniqueConstraintViolation',
					},
				],
			},
		},
		expectDatabase: {
			site: [{ id: testUuid(1), slug: 'en' }],
			contact_page: [{ site_id: testUuid(1), id: testUuid(2), title: 'Test' }],
		},
	})
})


