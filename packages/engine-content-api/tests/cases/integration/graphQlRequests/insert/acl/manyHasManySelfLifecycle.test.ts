import { test } from 'bun:test'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('self-referential M:N create connect normalizes the target update predicate', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Person', entity =>
				entity
					.column('name', column => column.type(Model.ColumnType.String))
					.manyHasMany('friends', relation => relation.target('Person').inversedBy('friendOf')))
			.buildSchema(),
		permissions: {
			Person: {
				predicates: {
					update_friend_of: { name: 'friend_name' },
				},
				operations: {
					read: { id: true },
					create: { id: true, name: true, friends: true },
					update: { id: true, friendOf: 'update_friend_of' },
				},
			},
		},
		variables: {
			friend_name: { eq: 'existing friend' },
		},
		query: GQL`mutation {
			createPerson(data: {name: "New person", friends: [{connect: {id: "${testUuid(2)}"}}]}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`with "root_" as
					(select ? :: uuid as "id", ? :: text as "name")
					insert into "public"."person" ("id", "name")
					select "root_"."id", "root_"."name"
					from "root_"
					returning "id"`,
				parameters: [testUuid(1), 'New person'],
				response: { rows: [{ id: testUuid(1) }] },
			},
			{
				sql: SQL`select "root_"."id" from "public"."person" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" as "primary"
					from "public"."person" as "root_"
					where "root_"."id" in (?, ?)
					order by "root_"."id" asc
					for update of "root_"`,
				parameters: [testUuid(1), testUuid(2)],
				response: { rows: [{ primary: testUuid(1) }, { primary: testUuid(2) }] },
			},
			{
				sql: SQL`select true as "authorized"
					from "public"."person" as "owning"
						inner join "public"."person" as "inverse" on true
					where "owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(1), 'existing friend', testUuid(2)],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`insert into "public"."person_friends" ("person_id", "friends_id")
					values (?, ?)
					on conflict do nothing`,
				parameters: [testUuid(1), testUuid(2)],
				response: { rowCount: 1 },
			},
			{
				sql: SQL`select true as "authorized"
					from "public"."person" as "owning"
						inner join "public"."person" as "inverse" on true
					where "owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?`,
				parameters: [testUuid(1), 'existing friend', testUuid(2)],
				response: { rows: [{ authorized: true }] },
			},
		]),
		return: {
			data: {
				createPerson: {
					ok: true,
				},
			},
		},
	})
})
