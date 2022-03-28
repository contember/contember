import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Tags with paginated posts (many has many inverse)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasMany('tags', relation => relation.target('Tag').inversedBy('posts')).column('name'),
			)
			.entity('Tag', entity => entity.column('name'))
			.buildSchema(),
		query: GQL`
        query {
          listTag {
            id
            paginatePosts {
				pageInfo {
					totalCount
				}
				edges {
					node {
						name
					}
				}
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id",
					         "root_"."id" as "root_id"
				         from "public"."tag" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select "junction_"."tag_id",
					         count(*) as "row_count"
				         from "public"."post_tags" as "junction_"
				         where "junction_"."tag_id" in (?, ?)
				         group by "junction_"."tag_id"`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ tag_id: testUuid(1), row_count: 2 },
						{ tag_id: testUuid(2), row_count: 1 },
					],
				},
			},
			{
				sql: SQL`select "junction_"."tag_id", "junction_"."post_id"
				         from "public"."post_tags" as "junction_"
				         where "junction_"."tag_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ tag_id: testUuid(1), post_id: testUuid(3) },
						{ tag_id: testUuid(2), post_id: testUuid(3) },
						{ tag_id: testUuid(1), post_id: testUuid(4) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."name" as "root_name",
						"root_"."id" as "root_id"
					from "public"."post" as "root_"
					where "root_"."id" in (?, ?)`,
				parameters: [testUuid(3), testUuid(4)],
				response: {
					rows: [
						{ root_id: testUuid(3), root_name: 'foo' },
						{ root_id: testUuid(4), root_name: 'bar' },
					],
				},
			},
		],
		return: {
			data: {
				listTag: [
					{
						id: testUuid(1),
						paginatePosts: {
							pageInfo: {
								totalCount: 2,
							},
							edges: [
								{
									node: { name: 'foo' },
								},
								{
									node: { name: 'bar' },
								},
							],
						},
					},
					{
						id: testUuid(2),
						paginatePosts: {
							pageInfo: {
								totalCount: 1,
							},
							edges: [
								{
									node: { name: 'foo' },
								},
							],
						},
					},
				],
			},
		},
	})
})

test('empty many-has-many inverse relation', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasMany('tags', relation => relation.target('Tag').inversedBy('posts')).column('name'),
			)
			.entity('Tag', entity => entity.column('name'))
			.buildSchema(),
		query: GQL`
        query {
          listTag {
            id
            posts {
				id
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id",
					         "root_"."id" as "root_id"
				         from "public"."tag" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select "junction_"."tag_id", "junction_"."post_id"  from "public"."post_tags" as "junction_"  where "junction_"."tag_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [],
				},
			},
		],
		return: {
			data: {
				listTag: [
					{
						id: testUuid(1),
						posts: [],
					},
					{
						id: testUuid(2),
						posts: [],
					},
				],
			},
		},
	})
})


