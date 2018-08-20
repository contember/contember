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
                     from "post" as "root_" 
                   where "root_"."id" = $1`,
						parameters: [testUuid(1)],
						response: [
							{
								root_id: testUuid(1),
								root_author: testUuid(2)
							}
						]
					},
					{
						sql: SQL`select
                       "root_"."id" as "root_id",
                       "root_"."id" as "root_id",
                       "root_"."name" as "root_name"
                     from "author" as "root_"
                     where "root_"."id" in ($1)`,
						parameters: [testUuid(2)],
						response: [
							{
								root_id: testUuid(2),
								root_name: 'John'
							}
						]
					},
					{
						sql: SQL`delete from "post"
		  where "id" = $1`,
						parameters: [testUuid(1)],
						response: []
					}
				])
			],
			return: {
				data: {
					deletePost: {
						author: {
							name: 'John'
						},
						id: testUuid(1)
					}
				}
			}
		})
	})
})
