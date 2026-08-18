import { afterEach, describe, expect, it } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { EntitySubTree } from '@contember/react-binding'
import { Editor, Transforms } from 'slate'
import { useSlateStatic } from 'slate-react'
import { BindingHarness, createBindingHarness } from '../../react-binding/tests/lib/harness/index'
import { convertModelToAdminSchema } from '../../react-binding/tests/lib/convertModelToAdminSchema'
import { BlockEditor } from '../src/index'

namespace BlockEditorModel {
	export class Article {
		blocks = c.oneHasMany(Block, 'article')
	}

	export class Block {
		article = c.manyHasOne(Article, 'blocks').notNull()
		order = c.intColumn().notNull()
		content = c.stringColumn()
	}
}

const schema = convertModelToAdminSchema(createSchema(BlockEditorModel).model)
const articleId = 'aaaaaaaa-0000-0000-0000-000000000001'

const paragraphElement = (text: string) => ({ type: 'paragraph', children: [{ text }] })

const paragraph = (text: string) => JSON.stringify({ formatVersion: 1, children: [paragraphElement(text)] })

const textOf = (content: string | null) => {
	if (content === null) {
		return null
	}
	const parsed = JSON.parse(content) as { children: { children: { text: string }[] }[] }
	return parsed.children[0].children.map(it => it.text).join('')
}

let harness: BindingHarness | undefined
let editor: Editor | undefined

afterEach(() => {
	harness?.unmount()
	harness = undefined
	editor = undefined
})

const CaptureEditor = () => {
	editor = useSlateStatic()
	return null
}

const mountEditor = async (
	blocks: { id: string; order: number; content: string }[],
	onPersistSuccess?: () => void,
) => {
	harness = await createBindingHarness({
		schema,
		data: { article: { id: articleId, blocks } },
		node: (
			<EntitySubTree entity={`Article(id = '${articleId}')`} alias="article" onPersistSuccess={() => onPersistSuccess?.()}>
				<BlockEditor
					field="blocks"
					sortableBy="order"
					contentField="content"
					renderSortableBlock={({ children }) => <>{children}</>}
				>
					<CaptureEditor />
				</BlockEditor>
			</EntitySubTree>
		),
	})
	return harness
}

/** The block editor registers its list unordered, so the test has to sort it the same way the editor does. */
const blocksOf = (harness: BindingHarness) =>
	Array.from(harness.getEntity('article').getEntityList('blocks'))
		.map(block => ({
			id: block.id,
			order: block.getField<number>('order').value,
			text: textOf(block.getField<string>('content').value),
		}))
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

const twoBlocks = [
	{ id: 'bbbbbbbb-0000-0000-0000-000000000001', order: 0, content: paragraph('first') },
	{ id: 'bbbbbbbb-0000-0000-0000-000000000002', order: 1, content: paragraph('second') },
]

describe('block editor', () => {
	it('renders the blocks it got from the server', async () => {
		const harness = await mountEditor(twoBlocks)

		expect(editor!.children).toHaveLength(2)
		expect(blocksOf(harness)).toEqual([
			{ id: twoBlocks[0].id, order: 0, text: 'first' },
			{ id: twoBlocks[1].id, order: 1, text: 'second' },
		])
	})

	it('creates a block for a node inserted in the middle', async () => {
		const harness = await mountEditor(twoBlocks)

		await harness.update(() => {
			Transforms.insertNodes(editor!, paragraphElement('inserted'), { at: [1] })
		})

		expect(blocksOf(harness).map(it => it.text)).toEqual(['first', 'inserted', 'second'])
		expect(blocksOf(harness).map(it => it.order)).toEqual([0, 1, 2])
	})

	it('deletes the block of a removed node', async () => {
		const harness = await mountEditor(twoBlocks)

		await harness.update(() => {
			Transforms.removeNodes(editor!, { at: [0] })
		})

		expect(blocksOf(harness).map(it => it.text)).toEqual(['second'])
	})

	it('saves typing into the block that owns the node', async () => {
		const harness = await mountEditor(twoBlocks)

		await harness.update(() => {
			Transforms.insertText(editor!, '!', { at: { path: [1, 0], offset: 6 } })
		})

		expect(blocksOf(harness).map(it => it.text)).toEqual(['first', 'second!'])
	})

	// The blocks created by a persist are the ones whose ids change under the editor, and the accounting that pairs
	// them with editor nodes is keyed by those ids. Getting it wrong used to scramble the content of every block or
	// duplicate the whole article on the very next edit. See PR #933.
	it('keeps blocks paired with their nodes across a persist', async () => {
		const harness = await mountEditor(twoBlocks)

		await harness.update(() => {
			Transforms.insertNodes(editor!, paragraphElement('inserted'), { at: [0] })
		})
		expect(blocksOf(harness).map(it => it.text)).toEqual(['inserted', 'first', 'second'])

		await harness.persist()

		expect(blocksOf(harness).map(it => it.text)).toEqual(['inserted', 'first', 'second'])
		expect(blocksOf(harness).every(it => it.id !== null)).toBe(true)

		await harness.update(() => {
			Transforms.insertNodes(editor!, paragraphElement('appended'), { at: [3] })
		})

		expect(blocksOf(harness).map(it => it.text)).toEqual(['inserted', 'first', 'second', 'appended'])
		expect(blocksOf(harness).map(it => it.order)).toEqual([0, 1, 2, 3])
	})

	// The window that broke a production application: an autosave persists, every block it created gets a new id, and the
	// editor is edited again before React has re-rendered. Rebuilding the accounting in the order the entities happen
	// to sit in the list rather than in the order the editor shows them pointed every ref at the wrong block, so the
	// next refresh rewrote the whole article. Editing from a persistSuccess handler is that window, deterministically.
	// See PR #933.
	it('keeps every block paired with its own node when an edit lands in the persist window', async () => {
		let editDuringPersist: (() => void) | undefined
		const harness = await mountEditor(twoBlocks, () => editDuringPersist?.())

		await harness.update(() => {
			Transforms.insertNodes(editor!, paragraphElement('inserted'), { at: [0] })
		})
		expect(blocksOf(harness).map(it => it.text)).toEqual(['inserted', 'first', 'second'])

		editDuringPersist = () => {
			Transforms.insertNodes(editor!, paragraphElement('appended'), { at: [3] })
		}
		await harness.persist()
		editDuringPersist = undefined

		const blocks = blocksOf(harness)
		expect(blocks.map(it => it.text)).toEqual(['inserted', 'first', 'second', 'appended'])
		expect(blocks).toHaveLength(4)
		// The rows that already existed have to keep the content they had. Losing that pairing rewrites every block
		// of the article, and anything hanging off a block — references, uploads — ends up on the wrong one.
		expect(blocks[1].id).toBe(twoBlocks[0].id)
		expect(blocks[2].id).toBe(twoBlocks[1].id)
		expect(blocks[0].id).not.toBe(twoBlocks[0].id)
	})

	it('does not duplicate blocks when editing right after a persist', async () => {
		const harness = await mountEditor(twoBlocks)

		await harness.update(() => {
			Transforms.insertNodes(editor!, paragraphElement('third'), { at: [2] })
			Transforms.insertNodes(editor!, paragraphElement('fourth'), { at: [3] })
		})
		await harness.persist()

		await harness.update(() => {
			Transforms.insertText(editor!, '!', { at: { path: [0, 0], offset: 5 } })
		})

		expect(blocksOf(harness)).toHaveLength(4)
		expect(blocksOf(harness).map(it => it.text)).toEqual(['first!', 'second', 'third', 'fourth'])

		await harness.persist()

		expect(blocksOf(harness)).toHaveLength(4)
	})
})
