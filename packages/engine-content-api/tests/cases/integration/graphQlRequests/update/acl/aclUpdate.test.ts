import { test } from 'vitest'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test'
import { c, createSchema, SchemaBuilder } from '@contember/schema-definition'
import {  Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('update name', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          ok
        }
      }`,
		permissions: {
			Author: {
				predicates: {
					name_predicate: { name: 'name_variable' },
				},
				operations: {
					update: {
						id: true,
						name: 'name_predicate',
					},
					read: {
						id: true,
					},
				},
			},
		},
		variables: {
			name_variable: { in: ['John', 'Jack'] },
		},
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ? and "root_"."name" in (?, ?)) 
						update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id" and "newData_"."name" in (?, ?)  returning "name_old__"`,
					parameters: ['John', testUuid(1), 'John', 'Jack', 'John', 'Jack'],
					response: { rows: [{ name_old__: 'John' }] },
				},
			]),
		],
		return: {
			data: {
				updateAuthor: {
					ok: true,
				},
			},
		},
	})
})

test('update name - denied', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          ok
        }
      }`,
		permissions: {
			Author: {
				predicates: {
					name_predicate: { name: { never: true } },
				},
				operations: {
					update: {
						id: true,
						name: 'name_predicate',
					},
					read: {
						id: true,
					},
				},
			},
		},
		variables: {
			name_variable: { in: ['John', 'Jack'] },
		},
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where false) 
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id" and false  returning "name_old__"`,
					parameters: ['John'],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				updateAuthor: {
					ok: false,
				},
			},
		},
	})
})

test('update m:n', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e
					.column('name', c => c.type(Model.ColumnType.String))
					.manyHasMany('categories', r =>
						r.target('Category', e => e.column('name', c => c.type(Model.ColumnType.String))).inversedBy('posts'),
					),
			)
			.buildSchema(),
		permissions: {
			Post: {
				predicates: {
					post_name_predicate: {
						name: 'post_name_variable',
					},
				},
				operations: {
					read: {
						id: true,
					},
					update: {
						id: true,
						categories: 'post_name_predicate',
					},
				},
			},
			Category: {
				predicates: {
					category_name_predicate: {
						name: 'category_name_variable',
					},
				},
				operations: {
					read: {
						id: true,
					},
					update: {
						posts: 'category_name_predicate',
					},
				},
			},
		},
		variables: {
			post_name_variable: { in: ['Lorem ipsum', 'Dolor sit'] },
			category_name_variable: { in: ['foo', 'bar'] },
		},
		query: GQL`mutation  {
          updatePost(by: {id: "${testUuid(1)}"}, data: {categories: [
						{connect: {id: "${testUuid(2)}"}},
						{disconnect: {id: "${testUuid(3)}"}},
          ]}) {
          ok
        }
				}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`with "data" as
            (select
               "owning"."id" as "post_id",
               "inverse"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."post" as "owning" on true
               inner join "public"."category" as "inverse" on true
             where "owning"."name" in (?, ?) and "owning"."id" = ? and "inverse"."name" in (?, ?) and
                   "inverse"."id" = ?),
								"insert" as
              (insert into "public"."post_categories" ("post_id", "category_id")
                select
                  "data"."post_id",
                  "data"."category_id"
                from "data"
              on conflict do nothing
              returning true as inserted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(insert.inserted, false) as "inserted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "insert" as "insert" on true`,
				parameters: ['Lorem ipsum', 'Dolor sit', testUuid(1), 'foo', 'bar', testUuid(2)],
				response: {
					rows: [{ selected: true, inserted: true }],
				},
			},
			{
				sql: SQL`select "root_"."id" from "public"."category" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(3)],
				response: { rows: [{ id: testUuid(3) }] },
			},
			{
				sql: SQL`with "data" as
            (select
               "owning"."id" as "post_id",
               "inverse"."id" as "category_id",
               true as "selected"
             from (values (null)) as "t" inner join "public"."post" as "owning" on true
               inner join "public"."category" as "inverse" on true
             where "owning"."name" in (?, ?) and "owning"."id" = ? and "inverse"."name" in (?, ?) and
                   "inverse"."id" = ?),
                "delete" as
              (delete from "public"."post_categories"
              using "data" as "data"
              where "post_categories"."post_id" = "data"."post_id" and "post_categories"."category_id" = "data"."category_id"
              returning true as deleted)
            select
              coalesce(data.selected, false) as "selected",
              coalesce(delete.deleted, false) as "deleted"
            from (values (null)) as "t" left join "data" as "data" on true
              left join "delete" as "delete" on true`,
				parameters: ['Lorem ipsum', 'Dolor sit', testUuid(1), 'foo', 'bar', testUuid(3)],
				response: {
					rows: [{ selected: true, deleted: true }],
				},
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})



namespace ConnectWithAclOnRead {
	export const editor = c.createRole('editor')

	@c.Allow(editor, {
		read: ['id'],
		update: ['id', 'category'],
	})
	export class Article {
		category = c.manyHasOne(Category)
	}

	@c.Allow(editor, {
		when: { isPublic: { eq: true } },
		read: ['id', 'slug'],
	})
	export class Category {
		isPublic = c.boolColumn().notNull()
		slug = c.stringColumn().notNull().unique()
	}

}

test('connect category', async () => {
	const schema = createSchema(ConnectWithAclOnRead)

	await execute({
		schema: schema.model,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${testUuid(1)}"},
            data: {category: {connect: {slug: "abcd"}}}
          ) {
          ok
        }
      }`,
		permissions: schema.acl.roles.editor.entities,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id"  from "public"."category" as "root_"  where "root_"."slug" = ? and "root_"."is_public" = ?`,
					parameters: ['abcd', true],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: uuid as "category_id", "root_"."category_id" as "category_id_old__", "root_"."id" from "public"."article" as "root_"  where "root_"."id" = ?) 
update "public"."article" set  "category_id" =  "newData_"."category_id" from "newData_"  where "article"."id" = "newData_"."id"  returning "category_id_old__"`,
					parameters: [testUuid(2), testUuid(1)],
					response: { rows: [{ category_id_old__: null }] },
				},
			]),
		],
		return: {
			data: {
				updateArticle: {
					ok: true,
				},
			},
		},
	})
})
