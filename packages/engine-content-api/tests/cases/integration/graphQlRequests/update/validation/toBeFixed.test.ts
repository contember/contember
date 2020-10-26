import { InputValidation as v, SchemaBuilder } from '@contember/schema-definition'
import { Model, Validation } from '@contember/schema'
import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

const bookSchema = new SchemaBuilder()
	.entity('Book', entity =>
		entity.column('name', c => c.type(Model.ColumnType.String)).oneHasMany('tags', r => r.target('Tag')),
	)
	.entity('Tag', e => e.column('label'))
	.buildSchema()

const bookValidation: Validation.Schema = {
	Book: {
		name: v.assert(v.rules.notEmpty(), 'Book name is required').buildRules(),
		tags: v
			.assert(v.rules.notEmpty(), 'You have to fill tags')
			.assert(v.rules.minLength(2), 'You have to fill at least two tags')
			.buildRules(),
	},
	Tag: {
		label: v.assert(v.rules.notEmpty(), 'Tag label is required').buildRules(),
	},
}

test.skip('update book with validation - failed', async () => {
	//fixme
	return

	await execute({
		schema: bookSchema,
		validation: bookValidation,
		query: GQL`
          mutation {
              updateBook(by: {id: "${testUuid(1)}"}, data: {name: "", tags: [{connect: {id: "${testUuid(
			2,
		)}"}}, {disconnect: {id: "${testUuid(3)}"}}]}) {
                  ok
                  validation {
                      valid
                      errors {
                          message {
                              text
                          }
                          path {
                              ... on _IndexPathFragment {
                                  index
                              }
                              ... on _FieldPathFragment {
                                  field
                              }
                          }
                      }
                  }
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id" from "public"."book" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1), name: 'John' }],
					},
				},
				{
					sql: SQL`select "root_"."book_id" as "__grouping_key", "root_"."id" as "root_id" from  "public"."tag" as "root_"   where "root_"."book_id" in (?)`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ __grouping_key: testUuid(1), root_id: testUuid(3) }],
					},
				},
			]),
		],
		return: {
			data: {
				updateBook: {
					node: null,
					ok: false,
					validation: {
						errors: [
							{
								message: {
									text: 'Book name is required',
								},
								path: [
									{
										field: 'name',
									},
								],
							},
							{
								message: {
									text: 'You have to fill at least two tags',
								},
								path: [
									{
										field: 'tags',
									},
								],
							},
						],
						valid: false,
					},
				},
			},
		},
	})
})
test.run()
