import { test } from 'uvu'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Post with author query (many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            author {
              id
              name
            }
          }
        }`,
		executes: [
			{
				sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."author_id" as "root_author"
              from "public"."post" as "root_"
						`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_author: testUuid(2),
						},
						{
							root_id: testUuid(3),
							root_author: testUuid(4),
						},
					],
				},
			},
			{
				sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."id" as "root_id",
                "root_"."name" as "root_name"
              from "public"."author" as "root_"
              where "root_"."id" in (?, ?)
						`,
				parameters: [testUuid(2), testUuid(4)],
				response: {
					rows: [
						{
							root_id: testUuid(2),
							root_name: 'John',
						},
						{
							root_id: testUuid(4),
							root_name: 'Jack',
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						author: {
							id: testUuid(2),
							name: 'John',
						},
					},
					{
						id: testUuid(3),
						author: {
							id: testUuid(4),
							name: 'Jack',
						},
					},
				],
			},
		},
	})
})

test('Post with author query with no result', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            author {
              id
              name
            }
          }
        }`,
		executes: [
			{
				sql: SQL`
              select
                "root_"."id" as "root_id",
                "root_"."author_id" as "root_author"
              from "public"."post" as "root_"
						`,
				response: {
					rows: [],
				},
			},
		],
		return: {
			data: {
				listPost: [],
			},
		},
	})
})

test('Post with author filtered by name (where many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost {
            id
            author (filter: {name: {eq: "John"}}) {
              id
            }
          }
        }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."author_id" as "root_author"
                     from "public"."post" as "root_"`,
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_author: testUuid(2),
						},
						{
							root_id: testUuid(3),
							root_author: testUuid(4),
						},
					],
				},
			},
			{
				sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (?, ?) and "root_"."name" = ?`,
				parameters: [testUuid(2), testUuid(4), 'John'],
				response: {
					rows: [
						{
							root_id: testUuid(2),
						},
					],
				},
			},
		],
		return: {
			data: {
				listPost: [
					{
						id: testUuid(1),
						author: {
							id: testUuid(2),
						},
					},
					{
						id: testUuid(3),
						author: null,
					},
				],
			},
		},
	})
})

test.run()
