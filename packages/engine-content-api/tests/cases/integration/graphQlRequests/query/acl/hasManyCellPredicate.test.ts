import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// A masked cell behaves as NULL, so `isNull: true` on a guarded cell of a has-many target matches a masked
// value too; the column `isNull` still selects the null-extended LEFT JOIN form of the subquery.

const schema = new SchemaBuilder()
	.entity('Author', e => e.column('name').oneHasMany('comments', r => r.target('Comment').ownedBy('author')))
	.entity('Comment', e => e.column('secret').column('isVisible', c => c.type(Model.ColumnType.Bool)))
	.buildSchema()

const permissions: Acl.Permissions = {
	Author: { predicates: {}, operations: { read: { id: true, name: true, comments: true } } },
	Comment: {
		predicates: { visible: { isVisible: { eq: true } } },
		operations: { read: { id: true, isVisible: true, author: true, secret: 'visible' } },
	},
}

test('a column isNull on a guarded cell of a has-many target matches a masked cell', async () => {
	await execute({
		schema,
		permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor(filter: { comments: { secret: { isNull: true } } }) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id"
					from "public"."author" as "root_"
					where exists (select 1 from (select "root_"."id") as "root_comments_tmp_"
						left join "public"."comment" as "root_comments" on "root_comments_tmp_"."id" = "root_comments"."author_id"
						where ("root_comments"."secret" is null or not coalesce("root_comments"."is_visible" = ?, false)))
				`,
				parameters: [true],
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
