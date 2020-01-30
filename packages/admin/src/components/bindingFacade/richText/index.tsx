import * as React from 'react'
import { Node, Range } from 'slate'
import { Editable, Slate } from 'slate-react'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from './plugins'
import { HoveringToolbar } from './toolbars'

export const TestWysiwyg = () => {
	const [selection, setSelection] = React.useState<Range | undefined>(undefined)
	const editor = React.useMemo(() => {
		const editor = withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials())))
		const originalApply = editor.apply
		editor.apply = operation => {
			if (
				operation.type === 'set_selection' &&
				(operation.newProperties === null ||
					(Range.isRange(operation.newProperties) && Range.isCollapsed(operation.newProperties)))
			) {
				setSelection(undefined)
			}
			originalApply(operation)
		}
		return editor
	}, [])
	const [value, setValue] = React.useState<typeof editor['children']>([
		{
			type: 'paragraph',
			children: [
				{ text: 'A line of text in a paragraph. It can contain ' },
				{
					type: 'anchor',
					children: [{ text: 'links' }],
					href: 'https://example.com',
				},
				{ text: ' and other ' },
				{ text: 'cool', isBold: true },
				{ text: ' stuff.' },
			],
		},
		{
			type: 'paragraph',
			children: [{ text: 'Someone wise said this.' }],
		},
	] as typeof editor['children'])
	const onChange = React.useCallback((node: Node[]) => {
		setValue(value => node as typeof value)
	}, [])
	const onSelect = React.useCallback(
		(e: React.SyntheticEvent) => {
			if (e.nativeEvent.type === 'selectionchange') {
				// Ignore the keyboard for now
				return
			}
			setSelection(editor.selection || undefined)
		},
		[editor.selection],
	)
	const selectionForToolbar = selection && Range.isExpanded(selection) ? selection : undefined
	return (
		<Slate editor={editor} value={value} onChange={onChange}>
			<HoveringToolbar selection={selectionForToolbar} />
			<Editable renderElement={editor.renderElement} renderLeaf={editor.renderLeaf} onSelect={onSelect} />
		</Slate>
	)
}
