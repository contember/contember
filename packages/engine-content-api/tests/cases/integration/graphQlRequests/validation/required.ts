import 'jasmine'
import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate, testUpdate } from './utils'
import { testUuid } from '../../../../src/testUuid'

describe('required validator in create', () => {
	it('fails when column value is not set', async () => {
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

	it('fails when column value is set to null', async () => {
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

	it('succeeds when column value is set', async () => {
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

	it('fails when required has-one relation is not set', async () => {
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

	it('succeeds when required has-one relation is set', async () => {
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
})

describe('required validator in update', () => {
	it('succeeds when column value is not set', async () => {
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

	it('fails when column value is set to null', async () => {
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

	it('succeeds when column value is set', async () => {
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

	it('succeeds when required has-one relation is not set', async () => {
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

	it('succeeds when required has-one relation is set', async () => {
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
})
