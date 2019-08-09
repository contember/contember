import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { executeDbTest } from '../../../src/testWithDb'
import { GQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'

describe('update with db', () => {
	describe('one has one - null checks', () => {
		describe('owner not null, inversed nullable', () => {
			const schema = new SchemaBuilder()
				.entity('Site', e => e.column('slug', c => c.unique().type(Model.ColumnType.String)))
				.entity('ContactPage', e =>
					e.column('title').oneHasOne('site', r =>
						r
							.target('Site')
							.inversedBy('contactPage')
							.notNull(),
					),
				)
				.buildSchema()

			it('update site & create contact page', async () => {
				await executeDbTest({
					schema,
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
						site: [{ id: testUuid(2), slug: 'en' }],
						contact_page: [{ site_id: testUuid(2), id: testUuid(4), title: 'Test' }],
					},
				})
			})

			it('update site & try to create contact page which however exists', async () => {
				await executeDbTest({
					schema,
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
            }
          }`,
					throws: {
						message: 'Constraint violations: Not null constraint violation on ContactPage::site in path ',
					},
					expectDatabase: {
						site: [{ id: testUuid(2), slug: 'en' }],
						contact_page: [{ site_id: testUuid(2), id: testUuid(3), title: 'Test' }],
					},
				})
			})
		})
	})
})
