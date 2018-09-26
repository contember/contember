import { Model } from 'cms-common'
import { execute, sqlTransaction } from '../../../src/test'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import SchemaBuilder from '../../../../src/content-schema/builder/SchemaBuilder'
import 'mocha'

describe('Delete mutation', () => {
	it('delete post', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
				.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deletePost(where: {id: "${testUuid(1)}"}) {
            id
            author {
              name
            }
          }
        }`,
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                     "root_"."id" as "root_id",
                      "root_"."author_id" as "root_author"
                     from "public"."post" as "root_" 
                   where "root_"."id" = $1`,
						parameters: [testUuid(1)],
						response: [
							{
								root_id: testUuid(1),
								root_author: testUuid(2),
							},
						],
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name"
                     from "public"."author" as "root_"
                     where "root_"."id" in ($1)`,
						parameters: [testUuid(2)],
						response: [
							{
								root_id: testUuid(2),
								root_name: 'John',
							},
						],
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = $1)`,
						parameters: [testUuid(1)],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deletePost: {
						author: {
							name: 'John',
						},
						id: testUuid(1),
					},
				},
			},
		})
	})

	it('delete post with acl', async () => {
		await execute({
			schema: new SchemaBuilder()
				.entity('Post', entity => entity.column('locale', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
			query: GQL`
        mutation {
          deletePost(where: {id: "${testUuid(1)}"}) {
            id
          }
        }`,
			permissions: {
				Post: {
					predicates: {
						locale_predicate: { locale: 'locale_variable' },
					},
					operations: {
						delete: 'locale_predicate',
						read: {
							id: true,
						},
					},
				},
			},
			variables: {
				locale_variable: ['cs'],
			},
			executes: [
				...sqlTransaction([
					{
						sql: SQL`select
                     "root_"."id" as "root_id"
                     from "public"."post" as "root_" 
                   where "root_"."id" = $1`,
						parameters: [testUuid(1)],
						response: [
							{
								root_id: testUuid(1),
							},
						],
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = $1 and "root_"."locale" in ($2))`,
						parameters: [testUuid(1), 'cs'],
						response: 1,
					},
				]),
			],
			return: {
				data: {
					deletePost: {
						id: testUuid(1),
					},
				},
			},
		})
	})
})
