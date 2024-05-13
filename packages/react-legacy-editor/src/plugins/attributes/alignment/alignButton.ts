import { Editor, Element as SlateElement, Node, Transforms } from 'slate'

export type AlignDirection = 'start' | 'center' | 'end' | 'justify' | undefined

const isAlignTarget = (editor: Editor, it: Node, direction: AlignDirection) =>
	SlateElement.isElement(it)
	&& editor.acceptsAttributes(it.type, { align: direction })

export const createAlignHandler = (direction: AlignDirection): {
	isActive?: (args: { editor: Editor }) => boolean
	shouldDisplay?: (args: { editor: Editor }) => boolean
	toggle: (args: { editor: Editor }) => void
}	=> ({
	shouldDisplay: ({ editor }) => {
		return Array.from(Editor.nodes(editor, { match: it => isAlignTarget(editor, it, direction) })).length > 0
	},
	isActive: ({ editor }) => {
		return Array.from(Editor.nodes(editor, { match: it => isAlignTarget(editor, it, direction) && (it as any).align === direction })).length > 0
	},
	toggle: ({ editor }) => {
		Transforms.setNodes(editor, {
			align: direction,
		}, {
			match: it => isAlignTarget(editor, it, direction),
		})
	},
})



