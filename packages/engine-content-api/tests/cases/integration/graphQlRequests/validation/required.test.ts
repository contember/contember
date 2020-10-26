import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate, testUpdate } from './utils'
import { testUuid } from '../../../../src/testUuid'
import { suite } from 'uvu'

const requiredValidationTest = suite('Required validation')

requiredValidationTest('create fails when column value is not set', async () => {
	class Author {
		@v.required('Author name is required')
		name = d.stringColumn()
	}

	const schema = createSchema({
		Author,
	})
	await testCreate({
		schema,
		entity: 'Author',
		data: {},
		errors: ['Author name is required'],
	})
})

requiredValidationTest('create fails when column value is set to null', async () => {
	class Author {
		@v.required('Author name is required')
		name = d.stringColumn()
	}

	const schema = createSchema({
		Author,
	})
	await testCreate({
		schema,
		entity: 'Author',
		data: { name: null },
		errors: ['Author name is required'],
	})
})

requiredValidationTest('create succeeds when column value is set', async () => {
	class Author {
		@v.required('Author name is required')
		name = d.stringColumn()
	}

	const schema = createSchema({
		Author,
	})
	await testCreate({
		schema,
		entity: 'Author',
		data: { name: 'John' },
		errors: [],
	})
})

requiredValidationTest('create fails when required has-one relation is not set', async () => {
	class Author {
		@v.required('Contact is required')
		contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	}

	class AuthorContact {
		email = d.stringColumn()
		author = d.oneHasOneInversed(Author, 'contact')
	}

	const schema = createSchema({
		Author,
		AuthorContact,
	})
	await testCreate({
		schema,
		entity: 'Author',
		data: {},
		errors: ['Contact is required'],
	})
})

requiredValidationTest('create succeeds when required has-one relation is set', async () => {
	class Author {
		@v.required('Contact is required')
		contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	}

	class AuthorContact {
		email = d.stringColumn()
		author = d.oneHasOneInversed(Author, 'contact')
	}

	const schema = createSchema({
		Author,
		AuthorContact,
	})
	await testCreate({
		schema,
		entity: 'Author',
		data: { contact: { create: {} } },
		errors: [],
	})
})
requiredValidationTest('update succeeds when column value is not set', async () => {
	class Author {
		@v.required('Author name is required')
		name = d.stringColumn()
	}

	const schema = createSchema({
		Author,
	})
	await testUpdate({
		schema,
		entity: 'Author',
		by: { id: testUuid(1) },
		data: {},
		errors: [],
	})
})

requiredValidationTest('update fails when column value is set to null', async () => {
	class Author {
		@v.required('Author name is required')
		name = d.stringColumn()
	}

	const schema = createSchema({
		Author,
	})
	await testUpdate({
		schema,
		by: { id: testUuid(1) },
		entity: 'Author',
		data: { name: null },
		errors: ['Author name is required'],
	})
})

requiredValidationTest('update succeeds when column value is set', async () => {
	class Author {
		@v.required('Author name is required')
		name = d.stringColumn()
	}

	const schema = createSchema({
		Author,
	})
	await testUpdate({
		schema,
		by: { id: testUuid(1) },
		entity: 'Author',
		data: { name: 'John' },
		errors: [],
	})
})

requiredValidationTest('update succeeds when required has-one relation is not set', async () => {
	class Author {
		@v.required('Contact is required')
		contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	}

	class AuthorContact {
		email = d.stringColumn()
		author = d.oneHasOneInversed(Author, 'contact')
	}

	const schema = createSchema({
		Author,
		AuthorContact,
	})
	await testUpdate({
		schema,
		by: { id: testUuid(1) },
		entity: 'Author',
		data: {},
		errors: [],
	})
})

requiredValidationTest('update succeeds when required has-one relation is set', async () => {
	class Author {
		@v.required('Contact is required')
		contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
	}

	class AuthorContact {
		email = d.stringColumn()
		author = d.oneHasOneInversed(Author, 'contact')
	}

	const schema = createSchema({
		Author,
		AuthorContact,
	})
	await testUpdate({
		schema,
		by: { id: testUuid(1) },
		entity: 'Author',
		data: { contact: { create: {} } },
		errors: [],
	})
})
requiredValidationTest.run()
