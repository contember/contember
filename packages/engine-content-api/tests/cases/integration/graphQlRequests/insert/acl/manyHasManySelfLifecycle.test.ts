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
				sql: SQL`with "data" as
					(select
						"owning"."id" as "person_id",
						"inverse"."id" as "friends_id",
						true as "selected"
					from (values (null)) as "t" inner join "public"."person" as "owning" on true
						inner join "public"."person" as "inverse" on true
					where "owning"."id" = ? and "inverse"."name" = ? and "inverse"."id" = ?),
					"insert" as
					(insert into "public"."person_friends" ("person_id", "friends_id")
						select "data"."person_id", "data"."friends_id"
						from "data"
						on conflict do nothing
						returning true as inserted)
					select
						coalesce(data.selected, false) as "selected",
						coalesce(insert.inserted, false) as "inserted"
					from (values (null)) as "t" left join "data" as "data" on true
						left join "insert" as "insert" on true`,
				parameters: [testUuid(1), 'existing friend', testUuid(2)],
				response: { rows: [{ selected: true, inserted: true }] },
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
