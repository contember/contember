import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// The Post read predicate reaches the company through the author. On every returned post it therefore implies the
// author read guard (one of its OR branches) and the company read guard, so hops through the same relations read
// the plain tables the predicate already joins instead of guarded sources.

const schema = new SchemaBuilder()
	.entity('Company', e => e.column('name').column('isPublic', c => c.type(Model.ColumnType.Bool)))
	.entity('Author', e =>
		e
			.column('name')
			.column('isActive', c => c.type(Model.ColumnType.Bool))
			.manyHasOne('company', r => r.target('Company')))
	.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
	.buildSchema()

const permissions: Acl.Permissions = {
	Post: {
		predicates: { viaCompany: { author: { company: { isPublic: { eq: true } } } } },
		operations: { read: { id: 'viaCompany', title: 'viaCompany', author: 'viaCompany' } },
	},
	Author: {
		predicates: { visible: { or: [{ isActive: { eq: true } }, { company: { isPublic: { eq: true } } }] } },
		operations: { read: { id: 'visible', name: 'visible', company: 'visible' } },
	},
	Company: {
		predicates: { pub: { isPublic: { eq: true } } },
		operations: { read: { id: 'pub', name: 'pub' } },
	},
}

test('order by through relations whose read guards the row predicate implies joins the plain tables', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listPost(orderBy: [{author: {company: {name: asc}}}]) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."post" as "root_"
					left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
					left join "public"."company" as "root_author_company" on "root_author"."company_id" = "root_author_company"."id"
					where "root_author_company"."is_public" = ?
					order by "root_author_company"."name" asc, "root_"."id" asc
				`,
				parameters: [true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listPost: [{ id: testUuid(1) }],
			},
		},
	})
})

test('a filter through relations whose read guards the row predicate implies joins the plain tables', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listPost(filter: {author: {company: {name: {eq: "Acme"}}}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."post" as "root_"
					left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
					left join "public"."company" as "root_author_company" on "root_author"."company_id" = "root_author_company"."id"
					where "root_author_company"."name" = ? and "root_author_company"."is_public" = ?
				`,
				parameters: ['Acme', true],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listPost: [{ id: testUuid(1) }],
			},
		},
	})
})

test('a read guard the row predicate does not imply keeps the guarded source', async () => {
	await execute({
		schema,
		permissions: {
			...permissions,
			Post: {
				predicates: { viaAuthor: { author: { name: { eq: 'John' } } } },
				operations: { read: { id: 'viaAuthor', title: 'viaAuthor', author: 'viaAuthor' } },
			},
		},
		variables: {},
		query: GQL`
        query {
          listPost(orderBy: [{author: {name: asc}}]) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."post" as "root_"
					left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
					left join (select "root_author$".* from "public"."author" as "root_author$"
						left join "public"."company" as "root_author$_company" on "root_author$"."company_id" = "root_author$_company"."id"
						where ("root_author$"."is_active" = ? or "root_author$_company"."is_public" = ?)) as "root_author$"
						on "root_"."author_id" = "root_author$"."id"
					where "root_author"."name" = ?
					order by "root_author$"."name" asc, "root_"."id" asc
				`,
				parameters: [true, true, 'John'],
				response: { rows: [{ root_id: testUuid(1) }] },
			},
		],
		return: {
			data: {
				listPost: [{ id: testUuid(1) }],
			},
		},
	})
})
