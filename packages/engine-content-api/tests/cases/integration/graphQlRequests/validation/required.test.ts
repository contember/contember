import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate, testUpdate } from './utils'
import { testUuid } from '../../../../src/testUuid'
import { describe, it, assert } from 'vitest'

describe('Required validation', () => {


	it('create fails when column value is not set', async () => {
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

	it('create fails when column value is set to null', async () => {
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

	it('create succeeds when column value is set', async () => {
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

	it('create fails when required has-one relation is not set', async () => {
		class Author {
			@v.required('Contact is required')
			contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
		}

		class AuthorContact {
			email = d.stringColumn()
			author = d.oneHasOneInverse(Author, 'contact')
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

	it('create succeeds when required has-one relation is set', async () => {
		class Author {
			@v.required('Contact is required')
			contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
		}

		class AuthorContact {
			email = d.stringColumn()
			author = d.oneHasOneInverse(Author, 'contact')
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
	it('update succeeds when column value is not set', async () => {
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

	it('update fails when column value is set to null', async () => {
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

	it('update succeeds when column value is set', async () => {
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

	it('update succeeds when required has-one relation is not set', async () => {
		class Author {
			@v.required('Contact is required')
			contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
		}

		class AuthorContact {
			email = d.stringColumn()
			author = d.oneHasOneInverse(Author, 'contact')
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

	it('update succeeds when required has-one relation is set', async () => {
		class Author {
			@v.required('Contact is required')
			contact: d.OneHasOneDefinition = d.oneHasOne(AuthorContact, 'author')
		}

		class AuthorContact {
			email = d.stringColumn()
			author = d.oneHasOneInverse(Author, 'contact')
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
