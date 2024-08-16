import { EditorElement, EditorPlugin } from '@contember/react-slate-editor-base'
import { ReactEditor } from 'slate-react'
import { ReactNode } from 'react'
import { Element, Transforms } from 'slate'
import { createElementKey } from '../../../internal/helpers/createElementKey'


export const withSortable = ({ render: Sortable }: {
	render: (props: { element: EditorElement; children: ReactNode }) => ReactNode
}): EditorPlugin => editor => {
	const { renderElement, normalizeNode } = editor

	editor.renderElement = props => {
		const path = ReactEditor.findPath(editor, props.element)
		if (path.length === 1) {
			return <Sortable element={props.element}>{renderElement(props)}</Sortable>
		}
		return renderElement(props)
	}

	editor.normalizeNode = entry => {
		const [node, path] = entry
		if (Element.isElement(node) && path.length === 1 && (!node.key || editor.children.findIndex(it => it !== node && it.key === node.key) !== -1)) {
			Transforms.setNodes(editor, {
				key: createElementKey(),
			}, { at: path })
		}
		normalizeNode(entry)
	}
}
