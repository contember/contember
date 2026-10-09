import { test } from 'bun:test'
import { Schema } from '@contember/schema'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { c, createSchema } from '@contember/schema-definition'
import { PermissionFactory } from '../../../../../../src/index.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

/**
 * A stored schema with the legacy `noRoot: ['read']`: `Article` is readable only through a relation, but
 * may be updated and deleted at the root. The root mutations locate their row in the nested read set, so
 * they keep working; the returned node stays gated on the root read grant, which does not exist.
 */
namespace LegacyNoRootRead {
	export const editor = c.createRole('editor')

	@c.Allow(editor, { when: { published: { eq: true } }, read: ['id', 'title'] })
	@c.Allow(editor, { update: ['title'], delete: true })
	export class Article {
		title = c.stringColumn()
		published = c.boolColumn().notNull()
	}
}

const createLegacySchema = (): Schema => {
	const schema = createSchema(LegacyNoRootRead)
	const role = schema.acl.roles.editor
	const article = role.entities.Article
	return {
		...schema,
		acl: {
			...schema.acl,
			roles: {
				editor: {
					...role,
					entities: {
						Article: { ...article, operations: { ...article.operations, noRoot: ['read'] } },
					},
				},
			},
		},
	}
}

const schema = createLegacySchema()
const permissions = new PermissionFactory().createContextual(schema, ['editor'])

const articleLookup = {
	// the read predicate of the legacy grant; at the root scope there is no read grant at all
	sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ? and "root_"."published" = ?`,
	parameters: [testUuid(1), true],
	response: { rows: [{ id: testUuid(1) }] },
}

const nodeSelect = {
	// the returned node is read at the root scope, which has no read grant
	sql: SQL`select "root_"."id" as "root_id" from "public"."article" as "root_" where false`,
	parameters: [],
	response: { rows: [] },
}

test('root update of an entity readable only through a relation locates its row', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
			updateArticle(by: {id: "${testUuid(1)}"}, data: {title: "Hello"}) { ok node { id } }
		}`,
		executes: sqlTransaction([
			articleLookup,
			{
				sql:
					SQL`with "newData_" as (select ? :: text as "title", "root_"."title" as "title_old__", "root_"."id", "root_"."published" from "public"."article" as "root_" where "root_"."id" = ?) update "public"."article" set "title" = "newData_"."title" from "newData_" where "article"."id" = "newData_"."id" returning "title_old__"`,
				parameters: ['Hello', testUuid(1)],
				response: { rows: [{ title_old__: 'Hi' }] },
			},
			nodeSelect,
		]),
		return: { data: { updateArticle: { ok: true, node: null } } },
	})
})

test('root delete of an entity readable only through a relation locates its row', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`mutation {
			deleteArticle(by: {id: "${testUuid(1)}"}) { ok node { id } }
		}`,
		executes: sqlTransaction([
			nodeSelect,
			articleLookup,
			{
				sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."article" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(1)],
				response: { rows: [{ id: testUuid(1), allowed: true }] },
			},
			{
				sql: SQL`delete from "public"."article" where "id" in (?)`,
				parameters: [testUuid(1)],
				response: {},
			},
		]),
		return: { data: { deleteArticle: { ok: true, node: null } } },
	})
})

test('an entity readable only through a relation has no root read fields', async () => {
	await execute({
		schema: schema.model,
		permissions: permissions.root,
		nestedPermissions: permissions.all,
		query: GQL`query {
			listArticle { id }
			getArticle(by: {id: "${testUuid(1)}"}) { id }
		}`,
		executes: [],
		return: {
			errors: [
				{ message: 'Cannot query field "listArticle" on type "Query".' },
				{ message: 'Cannot query field "getArticle" on type "Query".' },
			],
		},
	})
})
