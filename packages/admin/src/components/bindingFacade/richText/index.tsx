import { Box } from '@contember/ui'
import * as React from 'react'
import { Node } from 'slate'
import { Editable, Slate } from 'slate-react'
import { createEditorWithEssentials, withAnchors, withBasicFormatting, withParagraphs } from './plugins'
import { HoveringToolbar } from './toolbars'

export const TestWysiwyg: React.ComponentType = () => {
	const editor = React.useMemo(() => withParagraphs(withAnchors(withBasicFormatting(createEditorWithEssentials()))), [])
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
	return (
		<Box>
			<Slate editor={editor} value={value} onChange={onChange}>
				<Editable renderElement={editor.renderElement} renderLeaf={editor.renderLeaf} onKeyDown={editor.onKeyDown} />
				<HoveringToolbar />
			</Slate>
		</Box>
	)
}
TestWysiwyg.displayName = 'TestWysiwyg'

export * from './blockEditor'
