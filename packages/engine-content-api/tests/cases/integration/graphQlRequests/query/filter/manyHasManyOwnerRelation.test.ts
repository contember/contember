import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Post by category name (where many has many owning)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasMany('categories', relation =>
					relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))),
				),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {categories: {name: {eq: "Stuff"}}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."post" as "root_"
					where exists (select 1
						from "public"."post_categories" as "root_categories_junction_"
						inner join  "public"."category" as "root_categories" on  "root_categories_junction_"."category_id" = "root_categories"."id"
						where "root_"."id" = "root_categories_junction_"."post_id" and "root_categories"."name" = ?)`,
				parameters: ['Stuff'],
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(3),
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
					},
					{
						id: testUuid(3),
					},
				],
			},
		},
	})
})

test('Post by category ids (where many has many owning)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasMany('categories', relation =>
					relation.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))),
				),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {categories: {id: {in: ["${testUuid(10)}", "${testUuid(11)}"]}}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id"
						from "public"."post" as "root_"
						where exists (select 1
						              from "public"."post_categories" as "root_categories_junction_"
						              where "root_"."id" = "root_categories_junction_"."post_id" and "root_categories_junction_"."category_id" in (?, ?))
				`,
				parameters: [testUuid(10), testUuid(11)],
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(3),
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
					},
					{
						id: testUuid(3),
					},
				],
			},
		},
	})
})


test('Post by category tag name (where multiple many has many owning)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasMany('categories', relation =>
					relation.target('Category', e =>
						e.manyHasMany('tagsButWithVeryVeryVeryLongNameSoItReachesPostgresqlAliasLengthLimit', relation =>
							relation.target('Tag', e =>
								e.column('name', c => c.type(Model.ColumnType.String)),
							),
						),
					),
				),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {categories: {tagsButWithVeryVeryVeryLongNameSoItReachesPostgresqlAliasLengthLimit: {name: {eq: "Stuff"}}}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"  from "public"."post" as "root_"
					where exists (select 1  from "public"."post_categories" as "root_categories_junction_"
					    inner join  "public"."category" as "root_categories" on  "root_categories_junction_"."category_id" = "root_categories"."id"
					    left join  "public"."category_tags_but_with_very_very_very_long_name_so_it_reaches_postgresql_alias_length_limit" as "root_categoriesx_root_categoriestagsButWithVeryVeryVeryLongNa_3" on  "root_categories"."id" = "root_categoriesx_root_categoriestagsButWithVeryVeryVeryLongNa_3"."category_id"
					    left join  "public"."tag" as "root_categoriestagsButWithVeryVeryVeryLongNameSoItReachesPost_1" on  "root_categoriesx_root_categoriestagsButWithVeryVeryVeryLongNa_3"."tag_id" = "root_categoriestagsButWithVeryVeryVeryLongNameSoItReachesPost_1"."id"
					    where "root_"."id" = "root_categories_junction_"."post_id" and "root_categoriestagsButWithVeryVeryVeryLongNameSoItReachesPost_1"."name" = ?)`,
				parameters: ['Stuff'],
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(3),
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
					},
					{
						id: testUuid(3),
					},
				],
			},
		},
	})
})
