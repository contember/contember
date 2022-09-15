import { SchemaDefinition as def, AclDefinition as acl, createSchema } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { PermissionFactory } from '../../../../../../src'


namespace RowPredicateSubset {
	export const readerRole = acl.createRole('reader')
	@acl.allow(readerRole, {
		when: {
			isPublished: { eq: true },
		},
		read: ['isPublished', 'isUnlocked', 'title'],
	})
	@acl.allow(readerRole, {
		when: {
			and: [
				{ isUnlocked: { eq: true } },
				{ isPublished: { eq: true } },
			],
		},
		read: ['content'],
	})
	export class Article {
		isPublished = def.boolColumn()
		isUnlocked = def.boolColumn()
		title = def.stringColumn()
		content = def.stringColumn()
	}
}



test('row level predicate includes main predicate', async () => {
	const schema = createSchema(RowPredicateSubset)

	const permissions = new PermissionFactory(schema.model).create(schema.acl, ['reader'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listArticle {
            id
            title
            content
          }
        }`,
		executes: [
			{
				sql: SQL`SELECT
							 "root_"."id" AS "root_id",
							 TRUE AS "root___predicate_isPublished_eq_true",
							 "root_"."title" AS "root_title",
							 "root_"."is_unlocked" = ? AS "root___predicate_and_isUnlocked_eq_true_isPubl",
							 "root_"."content" AS "root_content"
						 FROM "public"."article" AS "root_"
						 WHERE "root_"."is_published" = ?`,
				parameters: [true, true],
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root___predicate_isPublished_eq_true: true,
							root_title: 'Hello',
							root___predicate_and_isUnlocked_eq_true_isPubl: false,
							root_content: 'Foo bar',
						},
						{
							root_id: testUuid(2),
							root___predicate_isPublished_eq_true: true,
							root_title: 'Hello 2',
							root___predicate_and_isUnlocked_eq_true_isPubl: true,
							root_content: 'Lorem ipsum',
						},
					],
				},
			},
		],
		return: {
			data: {
				listArticle: [
					{
						id: testUuid(1),
						title: 'Hello',
						content: null,
					},
					{
						id: testUuid(2),
						title: 'Hello 2',
						content: 'Lorem ipsum',
					},
				],
			},
		},
	})
})


