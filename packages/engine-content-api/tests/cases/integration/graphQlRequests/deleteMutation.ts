import { Model } from '@contember/schema'
import { execute, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { SchemaBuilder } from '@contember/schema-definition'
import 'jasmine'

describe('Delete mutation', () => {
	it('delete post', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}) {
            node {
              id
              author {
                name
              }
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                     "root_"."id" as "root_id",
                      "root_"."author_id" as "root_author"
                     from "public"."post" as "root_"
                   where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [
								{
									root_id: testUuid(1),
									root_author: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name",
                       "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" in (?)`,
						parameters: [testUuid(2)],
						response: {
							rows: [
								{
									root_id: testUuid(2),
									root_name: 'John',
								},
							],
						},
					},
					{
						sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
						parameters: [],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = ?)
						returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
						parameters: [],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deletePost: {
						node: {
							author: {
								name: 'John',
							},
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	it('delete author with posts and locales cascade delete', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.cascade)),
				)
				.entity('PostLocales', entity =>
					entity.manyHasOne('post', relation => relation.target('Post').onDelete(Model.OnDelete.cascade)),
				)
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(1)}"}) {
            node {
              id
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
							],
						},
					},
					{
						sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
						parameters: [],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."author"
            where "id" in (select "root_"."id"
                           from "public"."author" as "root_"
                           where "root_"."id" = ?)
            returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."author_id" in (?))
            returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(2) }, { id: testUuid(3) }] },
					},
					{
						sql: SQL`delete from "public"."post_locales"
            where "id" in (select "root_"."id"
                           from "public"."post_locales" as "root_"
                           where "root_"."post_id" in (?, ?))
            returning "id"`,
						parameters: [testUuid(2), testUuid(3)],
						response: { rows: [{ id: testUuid(4) }, { id: testUuid(5) }] },
					},
					{
						sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
						parameters: [],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deleteAuthor: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	it('delete author and set null on posts', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity =>
					entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.setNull)),
				)
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(1)}"}) {
            node {
              id
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
							],
						},
					},
					{
						sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
						parameters: [],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."author"
            where "id" in (select "root_"."id"
                           from "public"."author" as "root_"
                           where "root_"."id" = ?)
            returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "newData_" as (select
                                           ? :: uuid as "author_id",
                                           "root_"."id"
                                         from "public"."post" as "root_"
                                         where "root_"."author_id" in (?)) update "public"."post"
            set "author_id" = "newData_"."author_id" from "newData_"
            where "post"."id" = "newData_"."id"`,
						parameters: [null, testUuid(1)],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
						parameters: [],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deleteAuthor: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	it('delete post with acl', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('locale', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}) {
            node {
              id
            }
          }
        }`,
			permissions: {
				Post: {
					predicates: {
						locale_predicate: { locale: 'locale_variable' },
					},
					operations: {
						delete: 'locale_predicate',
						read: {
							id: true,
						},
					},
				},
			},
			variables: {
				locale_variable: ['cs'],
			},
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                     "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                   where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
							],
						},
					},
					{
						sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
						parameters: [],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = ? and "root_"."locale" in (?))
            returning "id"`,
						parameters: [testUuid(1), 'cs'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
						parameters: [],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deletePost: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})

	it('delete post with additional filter', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('locale', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}, filter: {locale: {eq: "cs"}}) {
            node {
              id
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                     "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                   where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [
								{
									root_id: testUuid(1),
								},
							],
						},
					},
					{
						sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
						parameters: [],
						response: 1,
					},
					{
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = ? and "root_"."locale" = ?)
            returning "id"`,
						parameters: [testUuid(1), 'cs'],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
						parameters: [],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deletePost: {
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		})
	})
})
