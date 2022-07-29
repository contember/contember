import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'


test('Posts with filtered tags', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasMany('tags', relation => relation.target('Tag')))
			.entity('Tag', entity => entity.column('name'))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            tags(filter: {name: {eq: "Foo"}}) {
				name
            }
          }
        }
			`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id",
					         "root_"."id" as "root_id"
				         from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select "junction_"."tag_id", "junction_"."post_id"  from "public"."post_tags" as "junction_" inner join  "public"."tag" as "root_" on  "junction_"."tag_id" = "root_"."id"  where "junction_"."post_id" in (?, ?) and "root_"."name" = ?`,
				parameters: [testUuid(1), testUuid(2), 'Foo'],
				response: {
					rows: [
						{ post_id: testUuid(1), tag_id: testUuid(3) },
						{ post_id: testUuid(2), tag_id: testUuid(3) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."name" as "root_name",
						"root_"."id" as "root_id"
					from "public"."tag" as "root_"
					where "root_"."id" in (?)`,
				parameters: [testUuid(3)],
				response: {
					rows: [
						{ root_id: testUuid(3), root_name: 'foo' },
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						tags: [
							{
								name: 'foo',
							},
						],
					},
					{
						id: testUuid(2),
						tags: [
							{
								name: 'foo',
							},
						],
					},
				],
			},
		},
	})
})



test('Posts with paginated tags (many has many owning)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasMany('tags', relation => relation.target('Tag')))
			.entity('Tag', entity => entity.column('name'))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            paginateTags {
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
				         from "public"."post" as "root_"`,
				response: {
					rows: [{ root_id: testUuid(1) }, { root_id: testUuid(2) }],
				},
			},
			{
				sql: SQL`select "junction_"."post_id",
					         count(*) as "row_count"
				         from "public"."post_tags" as "junction_"
				         where "junction_"."post_id" in (?, ?)
				         group by "junction_"."post_id"`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ post_id: testUuid(1), row_count: 2 },
						{ post_id: testUuid(2), row_count: 1 },
					],
				},
			},
			{
				sql: SQL`select "junction_"."tag_id", "junction_"."post_id"
				         from "public"."post_tags" as "junction_"
				         where "junction_"."post_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{ post_id: testUuid(1), tag_id: testUuid(3) },
						{ post_id: testUuid(2), tag_id: testUuid(3) },
						{ post_id: testUuid(1), tag_id: testUuid(4) },
					],
				},
			},
			{
				sql: SQL`
					select "root_"."name" as "root_name",
						"root_"."id" as "root_id"
					from "public"."tag" as "root_"
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
				listPost: [
					{
						id: testUuid(1),
						paginateTags: {
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
						paginateTags: {
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


