import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import ColumnType = Model.ColumnType

test('fragments', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasMany('posts', r => r.target('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))),
			)
			.buildSchema(),
		query: GQL`
				fragment PostData on Post {
					id
					title
				}
        fragment AuthorData on Author {
					id
					name
        }
        fragment AuthorPosts on Author {
	        posts {
		        ...PostData
	        }
        }
				fragment AuthorWithPost on Author {
					...AuthorData
					...AuthorPosts
				}
        query {
          listAuthor {
	          ...AuthorWithPost
          }
        }`,
		executes: [
			{
				sql: SQL`select
                     "root_"."id" as "root_id",
                     "root_"."name" as "root_name",
                     "root_"."id" as "root_id"
                   from "public"."author" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1), root_name: 'John' }],
				},
			},
			{
				sql: SQL`select
                     "root_"."author_id" as "__grouping_key",
                     "root_"."id" as "root_id",
                     "root_"."title" as "root_title"
                   from "public"."post" as "root_"
                   where "root_"."author_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						name: 'John',
						posts: [],
					},
				],
			},
		},
	})
})

test('fragments merge', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Product', entity => entity.oneHasMany('locales', r => r.target('ProductLocale')))
			.entity('ProductLocale', e =>
				e.column('name', c => c.notNull().type(ColumnType.String)).oneHasOne('image', r => r.target('Image')),
			)
			.entity('Image', e => e.column('url', c => c.notNull().type(ColumnType.String)))
			.buildSchema(),
		query: GQL`
				fragment Product on Product {
					locales {
						name
						image {
							url
						}
					}
				}
				query {
					listProduct {
						...Product
						locales {
							id
							image {
								id
							}
						}
					}
				}`,
		executes: [
			{
				sql: `select "root_"."id" as "root_id", "root_"."id" as "root_id"  from "public"."product" as "root_"`,
				parameters: [],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
			{
				sql: `select "root_"."product_id" as "__grouping_key", "root_"."name" as "root_name", "root_"."image_id" as "root_image", "root_"."id" as "root_id"  from "public"."product_locale" as "root_"   where "root_"."product_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [{ __grouping_key: testUuid(1), root_name: 'foo', root_id: testUuid(2), root_image: testUuid(3) }],
				},
			},
			{
				sql: `select "root_"."id" as "root_id", "root_"."url" as "root_url", "root_"."id" as "root_id"  from "public"."image" as "root_"   where "root_"."id" in (?)`,
				parameters: [testUuid(3)],
				response: { rows: [{ root_id: testUuid(3), root_url: 'abcd' }] },
			},
		],
		return: {
			data: {
				listProduct: [
					{
						locales: [
							{
								name: 'foo',
								id: testUuid(2),
								image: {
									url: 'abcd',
									id: testUuid(3),
								},
							},
						],
					},
				],
			},
		},
	})
})
test.run()
