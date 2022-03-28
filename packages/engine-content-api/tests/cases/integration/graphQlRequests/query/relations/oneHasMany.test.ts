import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Posts with locales query (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')))
			.entity('PostLocale', entity =>
				entity
					.column('locale', column => column.type(Model.ColumnType.String))
					.column('title', column => column.type(Model.ColumnType.String)),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            locales {
              id
              locale
              title
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: { rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }] },
			},
			{
				sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "public"."post_locale" as "root_"
                     where "root_"."post_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
						{ root_id: testUuid(4), root_locale: 'en', root_title: 'hello world', __grouping_key: testUuid(1) },
						{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						locales: [
							{
								id: testUuid(3),
								locale: 'cs',
								title: 'ahoj svete',
							},
							{
								id: testUuid(4),
								locale: 'en',
								title: 'hello world',
							},
						],
					},
					{
						id: testUuid(2),
						locales: [
							{
								id: testUuid(5),
								locale: 'cs',
								title: 'dalsi clanek',
							},
						],
					},
				],
			},
		},
	})
})

test('Posts with locales query with where (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')))
			.entity('PostLocale', entity =>
				entity
					.column('locale', column => column.type(Model.ColumnType.String))
					.column('title', column => column.type(Model.ColumnType.String)),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            locales(filter: {locale: {eq: "cs"}}) {
              id
              locale
              title
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select
                       "root_"."post_id" as "__grouping_key",
                       "root_"."id" as "root_id",
                       "root_"."locale" as "root_locale",
                       "root_"."title" as "root_title"
                     from "public"."post_locale" as "root_"
                     where "root_"."locale" = ? and "root_"."post_id" in (?, ?)`,
				parameters: ['cs', testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ root_id: testUuid(3), root_locale: 'cs', root_title: 'ahoj svete', __grouping_key: testUuid(1) },
						{ root_id: testUuid(5), root_locale: 'cs', root_title: 'dalsi clanek', __grouping_key: testUuid(2) },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						locales: [
							{
								id: testUuid(3),
								locale: 'cs',
								title: 'ahoj svete',
							},
						],
					},
					{
						id: testUuid(2),
						locales: [
							{
								id: testUuid(5),
								locale: 'cs',
								title: 'dalsi clanek',
							},
						],
					},
				],
			},
		},
	})
})

test('Posts with paginated comments (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('comments', relation => relation.target('Comment').ownedBy('post')))
			.entity('Comment', entity => entity.column('content').column('deletedAt', c => c.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            paginateComments(filter: {deletedAt: {isNull: true}}, first: 1) {
				pageInfo {
					totalCount
				}
				edges {
					node {
						content
					}
				}
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select
       				count(*) as "row_count", "root_"."post_id"
					from "public"."comment" as "root_"
					where "root_"."deleted_at" is null and "root_"."post_id" in (?, ?)
					group by "root_"."post_id"`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ post_id: testUuid(1), row_count: 5 },
						{ post_id: testUuid(2), row_count: 3 },
					],
				},
			},
			{
				sql: SQL`with "data" as
    				(select
    				    "root_"."post_id" as "__grouping_key",
    				    "root_"."content" as "root_content",
    					"root_"."id" as "root_id",
    				    row_number() over(partition by  "root_"."post_id" order by "root_"."id" asc) as "rowNumber_"
    					from "public"."comment" as "root_"
    					where "root_"."deleted_at" is null
    					      and "root_"."post_id" in (?, ?)
    					order by "root_"."id" asc)
					select "data".*  from "data"   where "data"."rowNumber_" <= ?`,
				parameters: [testUuid(1), testUuid(2), 1],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(3), root_content: 'Lorem ipsum' },
						{ __grouping_key: testUuid(2), root_id: testUuid(4), root_content: 'Dolor sit' },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						paginateComments: {
							pageInfo: {
								totalCount: 5,
							},
							edges: [
								{
									node: { content: 'Lorem ipsum' },
								},
							],
						},
					},
					{
						id: testUuid(2),
						paginateComments: {
							pageInfo: {
								totalCount: 3,
							},
							edges: [
								{
									node: { content: 'Dolor sit' },
								},
							],
						},
					},
				],
			},
		},
	})
})

test('Posts with comment count (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('comments', relation => relation.target('Comment').ownedBy('post')))
			.entity('Comment', entity => entity.column('content').column('deletedAt', c => c.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            paginateComments(filter: {deletedAt: {isNull: true}}, first: 1) {
				pageInfo {
					totalCount
				}
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select
       				count(*) as "row_count", "root_"."post_id"
					from "public"."comment" as "root_"
					where "root_"."deleted_at" is null and "root_"."post_id" in (?, ?)
					group by "root_"."post_id"`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ post_id: testUuid(1), row_count: 5 },
						{ post_id: testUuid(2), row_count: 3 },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						paginateComments: {
							pageInfo: {
								totalCount: 5,
							},
						},
					},
					{
						id: testUuid(2),
						paginateComments: {
							pageInfo: {
								totalCount: 3,
							},
						},
					},
				],
			},
		},
	})
})

test('Posts with paginated comments without count (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasMany('comments', relation => relation.target('Comment').ownedBy('post')))
			.entity('Comment', entity => entity.column('content').column('deletedAt', c => c.type(Model.ColumnType.DateTime)))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            paginateComments(filter: {deletedAt: {isNull: true}}, first: 1) {
				edges {
					node {
						content
					}
				}
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`with "data" as
    				(select
    				    "root_"."post_id" as "__grouping_key",
    				    "root_"."content" as "root_content",
    					"root_"."id" as "root_id",
    				    row_number() over(partition by  "root_"."post_id" order by "root_"."id" asc) as "rowNumber_"
    					from "public"."comment" as "root_"
    					where "root_"."deleted_at" is null
    					      and "root_"."post_id" in (?, ?)
    					order by "root_"."id" asc)
					select "data".*  from "data"   where "data"."rowNumber_" <= ?`,
				parameters: [testUuid(1), testUuid(2), 1],
				response: {
					rows: [
						{ __grouping_key: testUuid(1), root_id: testUuid(3), root_content: 'Lorem ipsum' },
						{ __grouping_key: testUuid(2), root_id: testUuid(4), root_content: 'Dolor sit' },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						paginateComments: {
							edges: [
								{
									node: { content: 'Lorem ipsum' },
								},
							],
						},
					},
					{
						id: testUuid(2),
						paginateComments: {
							edges: [
								{
									node: { content: 'Dolor sit' },
								},
							],
						},
					},
				],
			},
		},
	})
})


