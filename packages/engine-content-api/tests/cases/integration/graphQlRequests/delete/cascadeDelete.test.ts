import { test } from 'vitest'
import { execute, failedTransaction, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('delete author with posts and locales cascade delete', async () => {
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
            ok
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."post_id" as "ref", true as "allowed" from "public"."post_locales" as "root_" where "post_id" in (?)`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(3), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."author" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { },
				},
			]),
		],
		return: {
			data: {
				deleteAuthor: {
					ok: true,
				},
			},
		},
	})
})


test('delete author with posts (denied) ', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.cascade)),
			)
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(1)}"}) {
            ok
            errorMessage
          }
        }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: false }] },
				},
			]),
		],
		return: {
			data: {
				deleteAuthor: {
					ok: false,
					errorMessage: 'Execution has failed:\n' +
						'unknown field: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000001 row(s) of entity Author, because it is still referenced from 123e4567-e89b-12d3-a456-000000000002 row(s) of entity Post in relation author. OnDelete behaviour of this relation is set to "cascade". This is possibly caused by ACL denial.)',
				},
			},
		},
	})
})



