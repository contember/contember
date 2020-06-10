import 'jasmine'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { executeDbTest } from '@contember/engine-api-tester'
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
						site: [{ id: testUuid(1), slug: 'en' }],
						contact_page: [{ site_id: testUuid(1), id: testUuid(2), title: 'Test' }],
					},
				})
			}, 100000)

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
			}, 100000)
		})
	})

	describe('invalid input value', () => {
		const schema = new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('slug', c => c.type(Model.ColumnType.String).unique())
					.column('createdAt', c => c.type(Model.ColumnType.DateTime)),
			)
			.buildSchema()
		it('returns error for invalid date input', async () => {
			await executeDbTest({
				schema,
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
		}, 100000)

		it('returns error for invalid uuid', async () => {
			await executeDbTest({
				schema,
				seed: [],
				query: GQL`mutation {
        updatePost(by: { id: "abc" }, data: { createdAt: "2020-13-01 20:00" }) {
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
						errors: [
							{
								type: 'InvalidDataInput',
								message: jasmine.stringMatching(/invalid input syntax for (type )?uuid: "abc"/),
							},
						],
					},
				},
				expectDatabase: {},
			})
		}, 100000)
	})
})
