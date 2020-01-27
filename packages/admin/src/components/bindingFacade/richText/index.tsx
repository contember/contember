import * as React from 'react'
import { Node } from 'slate'
import { Editable, RenderElementProps, Slate } from 'slate-react'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from './plugins'

export const TestWysiwyg = () => {
	const editor = React.useMemo(() => withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials()))), [])
	const [value, setValue] = React.useState<typeof editor['children']>([
		//{
		//	type: 'paragraph',
		//	children: [
		//		{ text: 'A line of text in a paragraph. It can contain ' },
		//		{
		//			type: 'anchor',
		//			children: [{ text: 'links' }],
		//			href: 'https://example.com',
		//		},
		//		{ text: ' and other cool stuff' },
		//	],
		//},
		{
			type: 'paragraph',
			children: [{ text: 'Someone wise said this.' }],
		},
	])
	const onChange = React.useCallback((node: Node[]) => {
		setValue(value => node as typeof value)
	}, [])
	return (
		<Slate editor={editor} value={value} onChange={onChange}>
			<Editable renderElement={editor.renderElement} renderLeaf={editor.renderLeaf} />
		</Slate>
	)
}
