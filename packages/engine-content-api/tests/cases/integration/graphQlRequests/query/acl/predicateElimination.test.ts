import { SchemaDefinition as def } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

namespace TestModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'authors')
	}
	export class Article {
		title = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'articles')
	}
	export class Image {
		url = def.stringColumn().notNull()

		articles = def.oneHasMany(Article, 'image')
		authors = def.oneHasMany(Author, 'image')
	}
}
const permissions: Acl.Permissions = {
	Author: {
		predicates: {
			authorPredicate: {
				isPublic: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'authorPredicate',
				name: 'authorPredicate',
				image: 'authorPredicate',
			},
		},
	},
	Article: {
		predicates: {
			articlePredicate: {
				isPublic: { eq: true },
			},
		},
		operations: {
			read: {
				id: 'articlePredicate',
				title: 'articlePredicate',
				image: 'articlePredicate',
			},
		},
	},
	Image: {
		predicates: {
			imagePredicate: {
				or: [
					{ authors: { isPublic: { eq: true } } },
					{ articles: { isPublic: { eq: true } } },
				],
			},
		},
		operations: {
			read: {
				id: 'imagePredicate',
				url: 'imagePredicate',
			},
		},
	},
}

test('predicate with OR', async () => {
	await execute({
		schema: def.createModel(TestModel),
		permissions: permissions,
		variables: {},
		query: GQL`
        query {
          listAuthor {
            id
            image {
            	url
            }
          }
        }`,
		executes: [
			{
				sql: SQL`SELECT "root_"."id" AS "root_id", "root_"."image_id" AS "root_image"
						 FROM "public"."author" AS "root_"
						 WHERE "root_"."is_public" = ?`,
				parameters: [true],
				response: {
					rows: [
						{
							root_id: testUuid(1),
							root_image: testUuid(2),
						},
					],
				},
			},
			{
				sql: `select "root_"."id" as "root_id", "root_"."url" as "root_url", "root_"."id" as "root_id"  from "public"."image" as "root_"  where "root_"."id" in (?)`,
				parameters: [testUuid(2)],
				response: {
					rows: [
						{
							root_id: testUuid(2),
							root_url: 'abcd',
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
						image: {
							url: 'abcd',
						},
					},
				],
			},
		},
	})
})


