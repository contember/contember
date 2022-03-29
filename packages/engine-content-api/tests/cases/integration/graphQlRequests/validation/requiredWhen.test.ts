import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate, testUpdate } from './utils'
import { testUuid } from '../../../../src/testUuid'
import { describe, it, assert } from 'vitest'

export class Author {
	name = d.stringColumn()

	authorWithContact = d.boolColumn().notNull()

	@(v.when(v.rules.on('authorWithContact', v.rules.equals(true))).assertNotEmpty('E-mail is required'))
	email = d.stringColumn()
}

const schema = createSchema({ Author })
describe('Required when condition', () => {


	it('create succeeds when rule condition is not true', async () => {
		await testCreate({
			schema,
			entity: 'Author',
			data: { authorWithContact: false, email: null },
			executes: [],
			errors: [],
		})
	})
	it('create fails when rule condition is true and value is not filled', async () => {
		await testCreate({
			schema,
			entity: 'Author',
			data: { authorWithContact: true, email: null },
			executes: [],
			errors: ['E-mail is required'],
		})
	})
	it('create succeeds when rule condition is true and value is set', async () => {
		await testCreate({
			schema,
			entity: 'Author',
			data: { authorWithContact: true, email: 'xx@foo' },
			executes: [],
			errors: [],
		})
	})
	it('update fails when setting condition to true and current value in db is null', async () => {
		await testUpdate({
			schema: createSchema({ Author }),
			entity: 'Author',
			data: { authorWithContact: true },
			by: { id: testUuid(1) },
			executes: [
				{
					sql: 'select "root_"."email" as "root_email", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_email: null, root_id: testUuid(1) }],
					},
				},
			],
			errors: ['E-mail is required'],
		})
	})

	it('update succeeds when setting condition to true and current value in db is filled', async () => {
		await testUpdate({
			schema: createSchema({ Author }),
			entity: 'Author',
			data: { authorWithContact: true },
			by: { id: testUuid(1) },
			executes: [
				{
					sql: 'select "root_"."email" as "root_email", "root_"."id" as "root_id" from "public"."author" as "root_" where "root_"."id" = ?',
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_email: 'foo@bar.com', root_id: testUuid(1) }],
					},
				},
			],
			errors: [],
		})
	})

	it('update succeeds when setting condition to true and setting value to valid', async () => {
		await testUpdate({
			schema: createSchema({ Author }),
			entity: 'Author',
			data: { authorWithContact: true, email: 'aaa@b.com' },
			by: { id: testUuid(1) },
			executes: [],
			errors: [],
		})
	})
})
