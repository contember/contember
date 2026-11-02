import { test } from 'bun:test'
import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { PermissionFactory } from '../../../../../../src/index.js'

namespace TwoRoles {
	export const reviewer = acl.createRole('reviewer')
	export const publisher = acl.createRole('publisher')

	@acl.allow(reviewer, { read: true })
	@acl.allow(reviewer, { when: { _old: { state: { eq: 'draft' } }, _new: { state: { eq: 'review' } } }, update: ['state'] })
	@acl.allow(publisher, { read: true })
	@acl.allow(publisher, { when: { _old: { state: { eq: 'review' } }, _new: { state: { eq: 'published' } } }, update: ['state'] })
	export class Article {
		state = def.stringColumn().notNull()
	}
}

const updateState = GQL`mutation {
	updateArticle(by: {id: "${testUuid(1)}"}, data: {state: "published"}) {
		ok
	}
}`

test('several roles: each transition is checked as a whole, not old and new parts across roles', async () => {
	const schema = createSchema(TwoRoles)
	await execute({
		schema: schema.model,
		permissions: new PermissionFactory().create(schema, ['reviewer', 'publisher']),
		query: updateState,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "state", "root_"."state" as "state_old__", "root_"."id",
						"root_"."state" = ? as "old_predicate_0__", "root_"."state" = ? as "old_predicate_1__"
						from "public"."article" as "root_"  where "root_"."id" = ?)
						update  "public"."article" set  "state" =  "newData_"."state"   from "newData_"
						where "article"."id" = "newData_"."id"
						and (("newData_"."old_predicate_0__" and ("newData_"."state" = ?)) or ("newData_"."old_predicate_1__" and ("newData_"."state" = ?)))
						returning "state_old__"`,
					parameters: ['published', 'draft', 'review', testUuid(1), 'review', 'published'],
					response: { rows: [{ state_old__: 'review' }] },
				},
			]),
		],
		return: { data: { updateArticle: { ok: true } } },
	})
})

namespace StateMachine {
	export const editor = acl.createRole('editor')
	export const personId = acl.createPredefinedVariable('person', 'personID', editor)

	@acl.allow(editor, { read: true })
	@acl.allow(editor, { when: { _old: { state: { eq: 'draft' } }, _new: { state: { eq: 'review' } } }, update: ['state'] })
	@acl.allow(editor, { when: { _old: { state: { eq: 'review' } }, _new: { state: { in: ['draft', 'published'] } } }, update: ['state'] })
	@acl.allow(editor, { when: { owner: personId }, update: true })
	export class Article {
		state = def.stringColumn().notNull()
		owner = def.uuidColumn().notNull()
	}
}

test('state machine: several transition rules and an ownership rule on the same field', async () => {
	const schema = createSchema(StateMachine)
	await execute({
		schema: schema.model,
		permissions: new PermissionFactory().create(schema, ['editor']),
		variables: { editor__person: { in: [testUuid(9)] } },
		query: updateState,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "state", "root_"."state" as "state_old__", "root_"."id", "root_"."owner",
						"root_"."owner" in (?) as "old_predicate_0__", "root_"."state" = ? as "old_predicate_1__", "root_"."state" = ? as "old_predicate_2__"
						from "public"."article" as "root_"  where "root_"."id" = ?)
						update  "public"."article" set  "state" =  "newData_"."state"   from "newData_"
						where "article"."id" = "newData_"."id"
						and (("newData_"."old_predicate_0__" and ("newData_"."owner" in (?)))
							or ("newData_"."old_predicate_1__" and ("newData_"."state" in (?, ?)))
							or ("newData_"."old_predicate_2__" and ("newData_"."state" = ?)))
						returning "state_old__"`,
					parameters: ['published', testUuid(9), 'review', 'draft', testUuid(1), testUuid(9), 'draft', 'published', 'review'],
					response: { rows: [{ state_old__: 'review' }] },
				},
			]),
		],
		return: { data: { updateArticle: { ok: true } } },
	})
})

namespace MarkerFree {
	export const editor = acl.createRole('editor')

	@acl.allow(editor, { read: true })
	@acl.allow(editor, { when: { state: { eq: 'draft' } }, update: ['state'] })
	@acl.allow(editor, { when: { state: { eq: 'review' } }, update: ['state'] })
	export class Article {
		state = def.stringColumn().notNull()
	}
}

// the same statement main generated before `_old`/`_new` existed
test('a marker-free or predicate keeps its SQL', async () => {
	const schema = createSchema(MarkerFree)
	await execute({
		schema: schema.model,
		permissions: new PermissionFactory().create(schema, ['editor']),
		query: updateState,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "state", "root_"."state" as "state_old__", "root_"."id"
						from "public"."article" as "root_"  where "root_"."id" = ? and ("root_"."state" = ? or "root_"."state" = ?))
						update  "public"."article" set  "state" =  "newData_"."state"   from "newData_"
						where "article"."id" = "newData_"."id" and ("newData_"."state" = ? or "newData_"."state" = ?)
						returning "state_old__"`,
					parameters: ['published', testUuid(1), 'review', 'draft', 'review', 'draft'],
					response: { rows: [{ state_old__: 'draft' }] },
				},
			]),
		],
		return: { data: { updateArticle: { ok: true } } },
	})
})

test('updatable meta: whether the stored row admits some transition', async () => {
	const schema = createSchema(StateMachine)
	await execute({
		schema: schema.model,
		permissions: new PermissionFactory().create(schema, ['editor']),
		variables: { editor__person: { in: [testUuid(9)] } },
		query: GQL`query {
			listArticle {
				_meta { state { updatable } }
			}
		}`,
		executes: [
			{
				// `_new` parts drop out: the owner, or a row in draft or review, admits some update of `state`
				sql: SQL`select ("root_"."owner" in (?) or "root_"."state" = ? or "root_"."state" = ?) as "root___predicate_old_or_owner_person_old_state_eq",
					"root_"."id" as "root_id"  from "public"."article" as "root_"`,
				parameters: [testUuid(9), 'review', 'draft'],
				response: { rows: [{ root_id: testUuid(1), root___predicate_old_or_owner_person_old_state_eq: true }] },
			},
		],
		return: { data: { listArticle: [{ _meta: { state: { updatable: true } } }] } },
	})
})
