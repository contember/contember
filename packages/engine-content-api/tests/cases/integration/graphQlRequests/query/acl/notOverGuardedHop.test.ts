import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// A relation hop's row-level read predicate is compiled into the hop's table source (a guarded LEFT JOIN /
// EXISTS), never into the user's condition. Under `not` a predicate ANDed next to the condition —
// `not(name = ? and is_public)` — is TRUE for an unreadable author (`not(false and false)`) but NULL for an
// absent one, so the result set distinguishes "hidden author" from "no author": a presence oracle.
// With the guard in the join source both cases null-extend and `not(name = ?)` is NULL for both.

const schema = new SchemaBuilder()
	.entity('Company', e => e.column('name').column('isPublic', c => c.type(Model.ColumnType.Bool)))
	.entity('Author', e =>
		e
			.column('name')
			.column('isPublic', c => c.type(Model.ColumnType.Bool))
			.manyHasOne('company', r => r.target('Company'))
			.oneHasMany('books', r => r.target('Book').ownedBy('author')))
	.entity('Article', e => e.column('title').manyHasOne('author', r => r.target('Author')))
	.entity('Book', e => e.column('note'))
	.buildSchema()

const permissions: Acl.Permissions = {
	Article: { predicates: {}, operations: { read: { id: true, title: true, author: true } } },
	Author: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: 'pub', name: 'pub', isPublic: 'pub', company: 'pub', books: 'pub' } },
	},
	Company: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: 'pub', name: 'pub', isPublic: 'pub' } },
	},
	Book: {
		predicates: { shown: { note: { notEq: 'hidden' } } },
		operations: { read: { id: 'shown', note: 'shown' } },
	},
}

const openPermissions: Acl.Permissions = {
	Article: { predicates: {}, operations: { read: { id: true, title: true, author: true } } },
	Author: { predicates: {}, operations: { read: { id: true, name: true, isPublic: true, company: true, books: true } } },
	Company: { predicates: {}, operations: { read: { id: true, name: true, isPublic: true } } },
	Book: { predicates: {}, operations: { read: { id: true, note: true } } },
}

const guardedAuthorJoin =
	`left join (select "root_author$".* from "public"."author" as "root_author$" where "root_author$"."is_public" = ?) as "root_author$"
	on "root_"."author_id" = "root_author$"."id"`

test('not inside a to-one hop keeps the target read predicate in the join source', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { author: { not: { name: { eq: "zzz" } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."article" as "root_"
					${guardedAuthorJoin}
					where not("root_author$"."name" = ?)
				`,
				parameters: [true, 'zzz'],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listArticle: [{ id: testUuid(1) }],
			},
		},
	})
})

test('not above a to-one hop keeps the target read predicate in the join source', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { not: { author: { name: { eq: "zzz" } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."article" as "root_"
					${guardedAuthorJoin}
					where not("root_author$"."name" = ?)
				`,
				parameters: [true, 'zzz'],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listArticle: [{ id: testUuid(1) }],
			},
		},
	})
})

test('not over a deeper hop guards every hop source on the path', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { author: { not: { company: { name: { eq: "zzz" } } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."article" as "root_"
					${guardedAuthorJoin}
					left join (select "root_author$_company$".* from "public"."company" as "root_author$_company$" where "root_author$_company$"."is_public" = ?) as "root_author$_company$"
						on "root_author$"."company_id" = "root_author$_company$"."id"
					where not("root_author$_company$"."name" = ?)
				`,
				parameters: [true, true, 'zzz'],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listArticle: [{ id: testUuid(1) }],
			},
		},
	})
})

test('not inside a has-many hop keeps the target read predicate outside the negation', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { books: { not: { note: { eq: "zzz" } } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where exists (select 1 from "public"."book" as "root_books$"
						where "root_"."id" = "root_books$"."author_id" and not("root_books$"."note" = ?) and "root_books$"."note" != ?)
					and "root_"."is_public" = ?
				`,
				parameters: ['zzz', 'hidden', true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listAuthor: [{ id: testUuid(1) }],
			},
		},
	})
})

test('a predicate hop and a filter hop through the same relation do not share the join', async () => {
	// Article readable only through its author's flag (as-definer, plain join); the user filter on the same
	// relation reads through the guarded source. Sharing one guarded join would apply the reader's Author
	// guard to the definer's rule.
	const definerPermissions: Acl.Permissions = {
		...permissions,
		Article: {
			predicates: { viaAuthor: { author: { isPublic: { eq: true } } } },
			operations: { read: { id: 'viaAuthor', title: 'viaAuthor', author: 'viaAuthor' } },
		},
	}
	await execute({
		schema,
		permissions: definerPermissions,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { author: { name: { eq: "zzz" } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."article" as "root_"
					${guardedAuthorJoin}
					left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
					where "root_author$"."name" = ? and "root_author"."is_public" = ?
				`,
				parameters: [true, 'zzz', true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listArticle: [{ id: testUuid(1) }],
			},
		},
	})
})

test('relation absence without a read predicate keeps the FK shortcut', async () => {
	await execute({
		schema,
		permissions: openPermissions,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { author: { id: { isNull: true } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."article" as "root_"
					where "root_"."author_id" is null
				`,
				parameters: [],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listArticle: [{ id: testUuid(1) }],
			},
		},
	})
})

test('relation absence with a read predicate lowers to NOT EXISTS over readable rows', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listArticle(filter: { author: { id: { isNull: true } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."article" as "root_"
					where not(exists (select 1 from "public"."author" as "root_author$"
						where "root_"."author_id" = "root_author$"."id" and "root_author$"."is_public" = ?))
				`,
				parameters: [true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listArticle: [{ id: testUuid(1) }],
			},
		},
	})
})
