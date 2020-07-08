import 'jasmine'
import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate, testUpdate } from './utils'
import { testUuid } from '../../../../src/testUuid'

export class Author {
	name = d.stringColumn()

	@v.optional()
	@v.assertPattern(/.+@.+/, 'E-mail is not valid')
	email = d.stringColumn()
}

const schema = createSchema({ Author })

describe('optional in create', () => {
	it('succeeds when null', async () => {
		await testCreate({
			schema,
			entity: 'Author',
			data: { email: null },
			executes: [],
			errors: [],
		})
	})
	it('succeeds when not set', async () => {
		await testCreate({
			schema,
			entity: 'Author',
			data: {},
			executes: [],
			errors: [],
		})
	})
	it('fails when filled but not valid', async () => {
		await testCreate({
			schema,
			entity: 'Author',
			data: { email: 'xx' },
			executes: [],
			errors: ['E-mail is not valid'],
		})
	})
})

describe('optional in update', () => {
	it('fails when value is invalid', async () => {
		await testUpdate({
			schema: createSchema({ Author }),
			entity: 'Author',
			data: { email: 'aaa' },
			by: { id: testUuid(1) },
			executes: [],
			errors: ['E-mail is not valid'],
		})
	})

	it('succeeds when value is valid', async () => {
		await testUpdate({
			schema: createSchema({ Author }),
			entity: 'Author',
			data: { email: 'aaa@b.com' },
			by: { id: testUuid(1) },
			executes: [],
			errors: [],
		})
	})
})
