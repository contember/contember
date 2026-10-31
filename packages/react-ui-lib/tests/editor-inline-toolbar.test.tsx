import { afterEach, expect, test } from 'bun:test'
import { act, cleanup, render } from '@testing-library/react'
import { createEditor, Descendant, Transforms } from 'slate'
import { Editable, Slate, withReact } from 'slate-react'
import { EditorInlineToolbar } from '../src/editor/common/editor-inline-toolbar.js'

afterEach(cleanup)

const initialValue: Descendant[] = [{ children: [{ text: 'Hello world' }] }]

const renderToolbar = () => {
	const editor = withReact(createEditor())
	const result = render(
		<div style={{ position: 'relative' }}>
			<Slate editor={editor} initialValue={initialValue}>
				<EditorInlineToolbar>
					<button type="button">Link</button>
				</EditorInlineToolbar>
				<Editable />
			</Slate>
		</div>,
	)
	const toolbar = result.getByRole('button', { hidden: true }).closest('div.absolute')
	if (!(toolbar instanceof HTMLElement)) {
		throw new Error('Toolbar element not found')
	}
	return { editor, toolbar }
}

test('parked toolbar is hidden so its controls cannot take focus', () => {
	const { toolbar } = renderToolbar()

	expect(toolbar.style.visibility).toBe('hidden')
})

test('toolbar is visible over an expanded selection and hidden again once it collapses', async () => {
	const { editor, toolbar } = renderToolbar()

	await act(async () => {
		Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 5 } })
	})
	expect(toolbar.style.visibility).toBe('')

	await act(async () => {
		Transforms.collapse(editor, { edge: 'end' })
	})
	expect(toolbar.style.visibility).toBe('hidden')
	expect(toolbar.style.top).toBe('-1000vh')
})
