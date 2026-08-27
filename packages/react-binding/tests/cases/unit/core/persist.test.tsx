import { afterEach, describe, expect, it } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { EntityAccessor, ErrorPersistResult } from '@contember/binding-legacy'
import { EntitySubTree, Field, HasMany } from '../../../../src/index.js'
import { convertModelToAdminSchema } from '../../../lib/convertModelToAdminSchema.js'
import { BindingHarness, createBindingHarness } from '../../../lib/harness/index.js'

namespace PersistModel {
	export class Article {
		title = c.stringColumn()
		blocks = c.oneHasMany(Block, 'article')
	}

	export class Block {
		article = c.manyHasOne(Article, 'blocks').notNull()
		order = c.intColumn().notNull()
		content = c.stringColumn()
	}
}

const schema = convertModelToAdminSchema(createSchema(PersistModel).model)
const articleId = 'aaaaaaaa-0000-0000-0000-000000000001'
const firstBlockId = 'bbbbbbbb-0000-0000-0000-000000000001'
const secondBlockId = 'bbbbbbbb-0000-0000-0000-000000000002'

const articleData = {
	id: articleId,
	title: 'Hello',
	blocks: [
		{ id: firstBlockId, order: 0, content: 'first' },
		{ id: secondBlockId, order: 1, content: 'second' },
	],
}

let harness: BindingHarness | undefined

afterEach(() => {
	harness?.unmount()
	harness = undefined
})

const mountArticle = async (props: {
	onBeforePersist?: EntityAccessor.EntityEventListenerMap['beforePersist']
	onPersistSuccess?: EntityAccessor.EntityEventListenerMap['persistSuccess']
} = {}) => {
	harness = await createBindingHarness({
		schema,
		data: { article: articleData },
		node: (
			<EntitySubTree entity={`Article(id = '${articleId}')`} alias="article" {...props}>
				<Field field="title" />
				<HasMany field="blocks" orderBy="order">
					<Field field="order" />
					<Field field="content" />
				</HasMany>
			</EntitySubTree>
		),
	})
	return harness
}

const blocksOf = (harness: BindingHarness) => harness.getEntity('article').getEntityList({ field: 'blocks', orderBy: 'order' })

describe('persist', () => {
	it('loads the server response into accessors', async () => {
		const harness = await mountArticle()

		expect(harness.getEntity('article').getField('title').value).toBe('Hello')
		expect(Array.from(blocksOf(harness)).map(it => it.getField('content').value)).toEqual(['first', 'second'])
	})

	it('sends nothing when the tree is untouched', async () => {
		const harness = await mountArticle()

		const result = await harness.persist()

		expect(result.type).toBe('nothingToPersist')
		expect(harness.server.requests.filter(it => it.type === 'mutation')).toHaveLength(0)
	})

	it('gives a created entity its server id', async () => {
		const harness = await mountArticle()

		await harness.update(() => {
			blocksOf(harness).createNewEntity(getAccessor => {
				getAccessor().getField('order').updateValue(2)
				getAccessor().getField('content').updateValue('third')
			})
		})
		const dummyId = Array.from(blocksOf(harness))[2].id
		expect(Array.from(blocksOf(harness))[2].existsOnServer).toBe(false)

		const result = await harness.persist()

		expect(result.type).toBe('justSuccess')
		const persistedBlocks = Array.from(blocksOf(harness))
		expect(persistedBlocks).toHaveLength(3)
		expect(persistedBlocks.every(it => it.existsOnServer)).toBe(true)
		expect(persistedBlocks[2].id).toBe(harness.server.assignedIds.get(dummyId)!)
		expect(persistedBlocks[2].getField('content').value).toBe('third')
	})

	it('keeps the ids of the entities it did not create', async () => {
		const harness = await mountArticle()

		await harness.update(() => {
			harness.getEntity('article').getField('title').updateValue('Goodbye')
		})
		await harness.persist()

		expect(harness.getEntity('article').id).toBe(articleId)
		expect(Array.from(blocksOf(harness)).map(it => it.id)).toEqual([firstBlockId, secondBlockId])
		expect(harness.server.assignedIds.size).toBe(0)
	})

	it('drops a deleted entity from the list', async () => {
		const harness = await mountArticle()

		await harness.update(() => {
			blocksOf(harness).getChildEntityById(firstBlockId).deleteEntity()
		})
		await harness.persist()

		expect(Array.from(blocksOf(harness)).map(it => it.id)).toEqual([secondBlockId])
	})

	it('runs beforePersist before the mutation goes out', async () => {
		const harness = await mountArticle({
			onBeforePersist: getAccessor => {
				getAccessor().getField('title').updateValue('Rewritten by beforePersist')
			},
		})

		await harness.update(() => {
			harness.getEntity('article').getField('title').updateValue('Goodbye')
		})
		await harness.persist()

		expect(harness.getEntity('article').getField('title').value).toBe('Rewritten by beforePersist')
		const mutation = harness.server.requests.find(it => it.type === 'mutation')!
		expect(JSON.stringify(mutation.variables)).toContain('Rewritten by beforePersist')
	})

	it('runs persistSuccess once the response has landed', async () => {
		const seenTitles: (string | null)[] = []
		const harness = await mountArticle({
			onPersistSuccess: getAccessor => {
				seenTitles.push(getAccessor().getField<string>('title').value)
			},
		})

		await harness.update(() => {
			harness.getEntity('article').getField('title').updateValue('Goodbye')
		})
		await harness.persist()

		expect(seenTitles).toEqual(['Goodbye'])
	})

	it('reports a failed mutation through the persistError event', async () => {
		const harness = await mountArticle()
		const seenErrors: ErrorPersistResult[] = []
		harness.bindingOperations.addEventListener('persistError', error => {
			seenErrors.push(error)
		})

		harness.server.failNextMutation({ errorMessage: 'Nope.' })
		await harness.update(() => {
			harness.getEntity('article').getField('title').updateValue('Goodbye')
		})

		await expect(harness.persist()).rejects.toMatchObject({ type: 'invalidInput' })
		expect(seenErrors).toHaveLength(1)
	})

	it('attaches an execution error ending at a list item to that item', async () => {
		const harness = await mountArticle()

		harness.server.failNextMutation({
			errorMessage: `Execution has failed:\nop_1.blocks.0(_${firstBlockId.replace(/-/g, '_')}): NotFoundOrDenied`,
			errors: [{
				type: 'NotFoundOrDenied',
				message: 'NotFoundOrDenied',
				paths: [[{ field: 'blocks' }, { index: 0, alias: `_${firstBlockId.replace(/-/g, '_')}` }]],
			}],
		})
		await harness.update(() => {
			blocksOf(harness).getChildEntityById(firstBlockId).getField('content').updateValue('changed')
		})

		await expect(harness.persist()).rejects.toMatchObject({
			type: 'invalidInput',
			errors: [{ type: 'execution', code: 'NotFoundOrDenied' }],
		})
		expect(blocksOf(harness).getChildEntityById(firstBlockId).errors?.errors).toMatchObject([
			{ type: 'execution', code: 'NotFoundOrDenied' },
		])
		expect(blocksOf(harness).getChildEntityById(secondBlockId).errors).toBeUndefined()
	})

	it('keeps the persistError event quiet when the caller asks for silent errors', async () => {
		const harness = await mountArticle()
		const seenErrors: ErrorPersistResult[] = []
		harness.bindingOperations.addEventListener('persistError', error => {
			seenErrors.push(error)
		})
		const reportedToCaller: unknown[] = []

		harness.server.failNextMutation({ errorMessage: 'Nope.' })
		await harness.update(() => {
			harness.getEntity('article').getField('title').updateValue('Goodbye')
		})

		await expect(harness.persist({
			silentErrors: true,
			onPersistError: options => {
				reportedToCaller.push(options)
			},
		})).rejects.toMatchObject({ type: 'invalidInput' })
		expect(seenErrors).toHaveLength(0)
		expect(reportedToCaller).toHaveLength(1)
	})
})
