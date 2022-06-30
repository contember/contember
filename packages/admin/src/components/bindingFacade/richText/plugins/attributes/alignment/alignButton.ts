import { GenericToolbarButton } from '../../../toolbars'
import { Editor, Element as SlateElement, Node, Transforms } from 'slate'

export type AlignDirection = 'start' | 'center' | 'end' | 'justify' | undefined

const isAlignTarget = (editor: Editor, it: Node, direction: AlignDirection) =>
	SlateElement.isElement(it)
	&& editor.acceptsAttributes(it.type, { align: direction })

const createAlignHandler = (direction: AlignDirection): Pick<GenericToolbarButton, 'shouldDisplay' | 'isActive' | 'toggle'> => ({
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

export const alignStartButton: GenericToolbarButton = {
	label: 'Align left',
	blueprintIcon: 'align-left',
	...createAlignHandler(undefined),
}

export const alignEndButton: GenericToolbarButton = {
	label: 'Align right',
	blueprintIcon: 'align-right',
	...createAlignHandler('end'),
}

export const alignCenterButton: GenericToolbarButton = {
	label: 'Align center',
	blueprintIcon: 'align-center',
	...createAlignHandler('center'),
}

export const alignJustifyButton: GenericToolbarButton = {
	label: 'Justify',
	blueprintIcon: 'align-justify',
	...createAlignHandler('justify'),
}
