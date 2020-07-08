import 'jasmine'
import { InputValidation as v, SchemaDefinition as d } from '@contember/schema-definition'
import { createSchema, testCreate } from './utils'

describe('min length validation', () => {
	class Item {
		@v.assert(v.rules.minLength(5), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abc' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcdef' },
			errors: [],
		})
	})
})

describe('max length validation', () => {
	class Item {
		@v.assert(v.rules.maxLength(5), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcdef' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abc' },
			errors: [],
		})
	})
})

describe('length range validation', () => {
	class Item {
		@v.assert(v.rules.lengthRange(5, 6), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid #1', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd' },
			errors: ['failure'],
		})
	})
	it('fails when value not valid #2', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcdefg' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcde' },
			errors: [],
		})
	})
})

describe('range validation', () => {
	class Item {
		@v.assert(v.rules.range(5, 6), 'failure')
		value = d.intColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid #1', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 4 },
			errors: ['failure'],
		})
	})
	it('fails when value not valid #2', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 7 },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 5 },
			errors: [],
		})
	})
})

describe('pattern validation', () => {
	class Item {
		@v.assert(v.rules.pattern(/.+@.+/), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcde@bb.com' },
			errors: [],
		})
	})
})

describe('not empty validation', () => {
	class Item {
		@(v.assert(v.rules.notEmpty(), 'failure').noOptional())
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})

	it('fails when value not valid #1', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: {},
			errors: ['failure'],
		})
	})
	it('fails when value not valid #2', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: null },
			errors: ['failure'],
		})
	})
	it('fails when value not valid #3', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: '' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd' },
			errors: [],
		})
	})
})

describe('not validation', () => {
	class Item {
		@v.assert(v.rules.not(v.rules.pattern(/.+@.+/)), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcd@foo' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcde' },
			errors: [],
		})
	})
})

describe('logical AND validation', () => {
	class Item {
		@v.assert(v.rules.and(v.rules.pattern(/.+@.+/), v.rules.minLength(5)), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'a@b' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcde@bb.com' },
			errors: [],
		})
	})
})

describe('logical OR validation', () => {
	class Item {
		@v.assert(v.rules.or(v.rules.pattern(/.+@.+/), v.rules.minLength(5)), 'failure')
		value = d.stringColumn()
	}

	const schema = createSchema({
		Item,
	})
	it('fails when value not valid', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abc' },
			errors: ['failure'],
		})
	})

	it('succeeds when value valid #1', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'a@b' },
			errors: [],
		})
	})

	it('succeeds when value valid #2', async () => {
		await testCreate({
			schema,
			entity: 'Item',
			data: { value: 'abcdeagffg' },
			errors: [],
		})
	})
})
