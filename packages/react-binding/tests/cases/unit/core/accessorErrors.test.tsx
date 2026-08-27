import { afterEach, describe, expect, it } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { ErrorAccessor, ErrorPersistResult, isErrorPersistResult } from '@contember/binding-legacy'
import { ValidationError } from '@contember/client'
import { EntitySubTree, Field, HasMany, HasOne } from '../../../../src/index'
import { convertModelToAdminSchema } from '../../../lib/convertModelToAdminSchema'
import { BindingHarness, createBindingHarness, MutationErrorFixture, MutationFailure } from '../../../lib/harness/index'

namespace ErrorModel {
	export class Article {
		title = c.stringColumn()
		author = c.manyHasOne(Author)
		blocks = c.oneHasMany(Block, 'article')
	}

	export class Author {
		name = c.stringColumn()
	}

	export class Block {
		article = c.manyHasOne(Article, 'blocks').notNull()
		order = c.intColumn().notNull()
		content = c.stringColumn()
	}
}

const schema = convertModelToAdminSchema(createSchema(ErrorModel).model)
const articleId = 'aaaaaaaa-0000-0000-0000-000000000001'
const authorId = 'cccccccc-0000-0000-0000-000000000001'
const firstBlockId = 'bbbbbbbb-0000-0000-0000-000000000001'
const secondBlockId = 'bbbbbbbb-0000-0000-0000-000000000002'
const absentBlockId = 'bbbbbbbb-0000-0000-0000-000000000009'

let harness: BindingHarness | undefined

afterEach(() => {
	harness?.unmount()
	harness = undefined
})

const mountArticle = async () => {
	harness = await createBindingHarness({
		schema,
		data: {
			article: {
				id: articleId,
				title: 'Hello',
				author: { id: authorId, name: 'Jane' },
				blocks: [
					{ id: firstBlockId, order: 0, content: 'first' },
					{ id: secondBlockId, order: 1, content: 'second' },
				],
			},
		},
		node: (
			<EntitySubTree entity={`Article(id = '${articleId}')`} alias="article">
				<Field field="title" />
				<HasOne field="author">
					<Field field="name" />
				</HasOne>
				<HasMany field="blocks" orderBy="order">
					<Field field="order" />
					<Field field="content" />
				</HasMany>
			</EntitySubTree>
		),
	})
	return harness
}

const article = (harness: BindingHarness) => harness.getEntity('article')
const author = (harness: BindingHarness) => article(harness).getEntity('author')
const blocks = (harness: BindingHarness) => article(harness).getEntityList({ field: 'blocks', orderBy: 'order' })
const row = (harness: BindingHarness, id: string) => blocks(harness).getChildEntityById(id)

/** The message of every error sitting on an accessor, execution and validation alike. */
const messagesOn = (holder: { readonly errors: ErrorAccessor | undefined }) =>
	holder.errors?.errors.map(error => error.type === 'execution' ? error.developerMessage : error.message)

type ErrorPath = ValidationError['path']

/** The path the engine reports for a list item: the relation, then the index carrying the alias the binding sent. */
const rowPath = (id: string, ...rest: ErrorPath): ErrorPath => [
	{ field: 'blocks' },
	{ index: 0, alias: `_${id.replace(/-/g, '_')}` },
	...rest,
]

const executionError = (message: string, path: ErrorPath): MutationErrorFixture => ({ type: 'NotFoundOrDenied', message, paths: [path] })
const validationError = (message: string, path: ErrorPath): ValidationError => ({ message: { text: message }, path })

/** Dirties the tree, persists it against a response that fails, and hands back the rejection. */
const persistFailing = async (harness: BindingHarness, failure: Omit<MutationFailure, 'errorMessage'>): Promise<ErrorPersistResult> => {
	harness.server.failNextMutation({ errorMessage: 'The mutation has failed.', ...failure })
	await harness.update(() => {
		article(harness).getField('title').updateValue('Goodbye')
	})

	let rejection: unknown
	await harness.persist().then(() => {}, error => {
		rejection = error
	})
	if (!isErrorPersistResult(rejection)) {
		throw new Error('The persist was expected to fail.')
	}
	return rejection
}

describe('accessor errors', () => {
	describe('where one execution error lands', () => {
		it('on the entity the mutation was for', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, { errors: [executionError('on the article', [])] })

			expect(messagesOn(article(harness))).toEqual(['on the article'])
		})

		it('on a plain field', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, { errors: [executionError('on the title', [{ field: 'title' }])] })

			expect(messagesOn(article(harness).getField('title'))).toEqual(['on the title'])
			expect(article(harness).errors).toBeUndefined()
		})

		it('on a has-one relation', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, { errors: [executionError('on the author', [{ field: 'author' }])] })

			expect(messagesOn(author(harness))).toEqual(['on the author'])
		})

		it('on a field of a has-one relation', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, { errors: [executionError('on the name', [{ field: 'author' }, { field: 'name' }])] })

			expect(messagesOn(author(harness).getField('name'))).toEqual(['on the name'])
			expect(author(harness).errors).toBeUndefined()
		})

		it('on the list as a whole', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, { errors: [executionError('on the blocks', [{ field: 'blocks' }])] })

			expect(messagesOn(blocks(harness))).toEqual(['on the blocks'])
			expect(row(harness, firstBlockId).errors).toBeUndefined()
		})

		it('on a list row', async () => {
			const harness = await mountArticle()

			const result = await persistFailing(harness, { errors: [executionError('on the first row', rowPath(firstBlockId))] })

			expect(messagesOn(row(harness, firstBlockId))).toEqual(['on the first row'])
			expect(row(harness, secondBlockId).errors).toBeUndefined()
			expect(blocks(harness).errors).toBeUndefined()
			expect(result.errors).toMatchObject([{ type: 'execution', code: 'NotFoundOrDenied' }])
		})

		it('on a field of a list row', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, { errors: [executionError('on the first content', rowPath(firstBlockId, { field: 'content' }))] })

			expect(messagesOn(row(harness, firstBlockId).getField('content'))).toEqual(['on the first content'])
			expect(row(harness, firstBlockId).errors).toBeUndefined()
		})

		it('nowhere, when it names a row the list does not hold', async () => {
			const harness = await mountArticle()

			const result = await persistFailing(harness, { errors: [executionError('on a stranger', rowPath(absentBlockId))] })

			expect(result.errors).toEqual([])
			expect(blocks(harness).errors).toBeUndefined()
			expect(article(harness).errors).toBeUndefined()
		})
	})

	describe('several errors in one response', () => {
		it('reach every failing row', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, {
				errors: [
					executionError('on the first row', rowPath(firstBlockId)),
					executionError('on the second row', rowPath(secondBlockId)),
				],
			})

			expect(messagesOn(row(harness, firstBlockId))).toEqual(['on the first row'])
			expect(messagesOn(row(harness, secondBlockId))).toEqual(['on the second row'])
			expect(blocks(harness).errors).toBeUndefined()
		})

		it('reach every failing field of a row', async () => {
			const harness = await mountArticle()

			const result = await persistFailing(harness, {
				errors: [
					executionError('on the first content', rowPath(firstBlockId, { field: 'content' })),
					executionError('on the second content', rowPath(secondBlockId, { field: 'content' })),
				],
			})

			expect(messagesOn(row(harness, firstBlockId).getField('content'))).toEqual(['on the first content'])
			expect(messagesOn(row(harness, secondBlockId).getField('content'))).toEqual(['on the second content'])
			expect(result.errors).toHaveLength(2)
		})

		it('reach targets of different shapes at once', async () => {
			const harness = await mountArticle()

			const result = await persistFailing(harness, {
				errors: [
					executionError('on the title', [{ field: 'title' }]),
					executionError('on the first row', rowPath(firstBlockId)),
					executionError('on the second content', rowPath(secondBlockId, { field: 'content' })),
				],
			})

			expect(messagesOn(article(harness).getField('title'))).toEqual(['on the title'])
			expect(messagesOn(row(harness, firstBlockId))).toEqual(['on the first row'])
			expect(messagesOn(row(harness, secondBlockId).getField('content'))).toEqual(['on the second content'])
			expect(result.errors).toHaveLength(3)
		})
	})

	describe('validation errors', () => {
		it('reach the field of the row they name', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, {
				validation: [validationError('Field is required', rowPath(firstBlockId, { field: 'content' }))],
			})

			expect(row(harness, firstBlockId).getField('content').errors?.errors).toEqual([
				{ type: 'validation', code: 'fieldRequired', message: 'Field is required' },
			])
		})

		it('reach every failing row of one response', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, {
				validation: [
					validationError('Field is required', rowPath(firstBlockId, { field: 'content' })),
					validationError('Too long', rowPath(secondBlockId, { field: 'content' })),
				],
			})

			expect(messagesOn(row(harness, firstBlockId).getField('content'))).toEqual(['Field is required'])
			expect(row(harness, secondBlockId).getField('content').errors?.errors).toEqual([
				{ type: 'validation', code: undefined, message: 'Too long' },
			])
		})

		it('take precedence over the execution errors of the same response', async () => {
			const harness = await mountArticle()

			await persistFailing(harness, {
				errors: [executionError('on the second row', rowPath(secondBlockId))],
				validation: [validationError('Field is required', rowPath(firstBlockId, { field: 'content' }))],
			})

			expect(messagesOn(row(harness, firstBlockId).getField('content'))).toEqual(['Field is required'])
			expect(row(harness, secondBlockId).errors).toBeUndefined()
		})
	})

	describe('lifecycle', () => {
		it('are cleared when the next persist starts, so a retry reaches the server', async () => {
			const harness = await mountArticle()
			await persistFailing(harness, { errors: [executionError('on the first row', rowPath(firstBlockId))] })

			const result = await harness.persist()

			expect(result.type).toBe('justSuccess')
			expect(row(harness, firstBlockId).errors).toBeUndefined()
			expect(harness.server.requests.filter(it => it.type === 'mutation')).toHaveLength(2)
		})

		it('are dropped one accessor at a time', async () => {
			const harness = await mountArticle()
			await persistFailing(harness, {
				errors: [
					executionError('on the first content', rowPath(firstBlockId, { field: 'content' })),
					executionError('on the second content', rowPath(secondBlockId, { field: 'content' })),
				],
			})

			await harness.update(() => {
				row(harness, firstBlockId).getField('content').clearErrors()
			})

			expect(row(harness, firstBlockId).getField('content').errors).toBeUndefined()
			expect(messagesOn(row(harness, secondBlockId).getField('content'))).toEqual(['on the second content'])
		})
	})
})
