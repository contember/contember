import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { Model, Validation } from '@contember/schema'
import { InputValidation as v, SchemaBuilder } from '@contember/schema-definition'

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

test.skip('insert book with validation - failed', async () => {
	// fixme
	return

	await execute({
		schema: bookSchema,
		validation: bookValidation,
		query: GQL`
          mutation {
              createBook(data: {}) {
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
		executes: [...sqlTransaction([])],
		return: {
			data: {
				createBook: {
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
									text: 'You have to fill tags',
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

test.skip('insert book with validation - ok', async () => {
	// fixme
	return

	await execute({
		schema: bookSchema,
		validation: bookValidation,
		query: GQL`
          mutation {
              createBook(data: {name: "John", tags: [{create: {label: "abcd"}}, {create: {label: "xyz"}}]}) {
                  ok
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: `with "root_" as (select ? :: uuid as "id", ? :: text as "name")
						insert into  "public"."book" ("id", "name") select "root_"."id", "root_"."name" from  "root_"   returning "id"`,
					parameters: [testUuid(1), 'John'],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: `with "root_" as (select ? :: uuid as "book_id", ? :: uuid as "id", ? :: text as "label")
						insert into  "public"."tag" ("book_id", "id", "label") select "root_"."book_id", "root_"."id", "root_"."label" from  "root_"   returning "id"`,
					parameters: [testUuid(1), testUuid(2), 'abcd'],
					response: {
						rows: [{ id: testUuid(2) }],
					},
				},
				{
					sql: `with "root_" as (select ? :: uuid as "book_id", ? :: uuid as "id", ? :: text as "label")
						insert into  "public"."tag" ("book_id", "id", "label") select "root_"."book_id", "root_"."id", "root_"."label" from  "root_"   returning "id"`,
					parameters: [testUuid(1), testUuid(3), 'xyz'],
					response: {
						rows: [{ id: testUuid(3) }],
					},
				},
				{
					sql: `select "root_"."id" as "root_id" from  "public"."book" as "root_"   where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
			]),
		],
		return: {
			data: {
				createBook: {
					ok: true,
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test.run()
