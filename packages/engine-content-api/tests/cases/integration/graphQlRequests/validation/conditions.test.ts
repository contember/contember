import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from './utils'
import { suite } from 'uvu'

export class Author {
	name = d.stringColumn()

	emailValidated = d.boolColumn().notNull()

	@(v.when(v.rules.on('emailValidated', v.rules.equals(true))).assertPattern(/.+@.+/, 'E-mail is not valid'))
	email = d.stringColumn().notNull()
}

const schema = createSchema({ Author })
const validationConditionTest = suite('Validation conditions')
validationConditionTest('succeeds when rule condition is not true', async () => {
	await testCreate({
		schema,
		entity: 'Author',
		data: { emailValidated: false, email: 'abcd' },
		executes: [],
		errors: [],
	})
})
validationConditionTest('fails when rule condition is true and value is not valid', async () => {
	await testCreate({
		schema,
		entity: 'Author',
		data: { emailValidated: true, email: 'abcd' },
		executes: [],
		errors: ['E-mail is not valid'],
	})
})
validationConditionTest('succeeds when rule condition is true and value is set', async () => {
	await testCreate({
		schema,
		entity: 'Author',
		data: { emailValidated: true, email: 'xx@foo' },
		executes: [],
		errors: [],
	})
})
validationConditionTest.run()
