import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate, testUpdate } from './utils'
import { testUuid } from '../../../../src/testUuid'
import { suite } from 'uvu'

export class Author {
	name = d.stringColumn()

	@v.assertPattern(/.+@.+/, 'E-mail is not valid')
	email = d.stringColumn()
}

const schema = createSchema({ Author })

const optionalValidationTest = suite('Optional validation')
optionalValidationTest('create succeeds when null', async () => {
	await testCreate({
		schema,
		entity: 'Author',
		data: { email: null },
		executes: [],
		errors: [],
	})
})
optionalValidationTest('create succeeds when not set', async () => {
	await testCreate({
		schema,
		entity: 'Author',
		data: {},
		executes: [],
		errors: [],
	})
})
optionalValidationTest('create fails when filled but not valid', async () => {
	await testCreate({
		schema,
		entity: 'Author',
		data: { email: 'xx' },
		executes: [],
		errors: ['E-mail is not valid'],
	})
})

optionalValidationTest('update fails when value is invalid', async () => {
	await testUpdate({
		schema: createSchema({ Author }),
		entity: 'Author',
		data: { email: 'aaa' },
		by: { id: testUuid(1) },
		executes: [],
		errors: ['E-mail is not valid'],
	})
})

optionalValidationTest('update succeeds when value is valid', async () => {
	await testUpdate({
		schema: createSchema({ Author }),
		entity: 'Author',
		data: { email: 'aaa@b.com' },
		by: { id: testUuid(1) },
		executes: [],
		errors: [],
	})
})
optionalValidationTest.run()
